import React, { useEffect, useMemo, useRef, useState } from "react";
import { useStateValue } from "../../state-management/StateProvider";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import "../../styles/Table.css";
import {
  sendEquipmentDeletedEmail,
  sendEquipmentUpdateEmail,
} from "../../services/email-service";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogTitle,
  IconButton,
  Snackbar,
  Stack,
  TableCell,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DeleteRounded, EditRounded } from "@mui/icons-material";
import { keyframes } from "@mui/system";
import {
  CHANGE_ACTIONS,
  createChangeLogEntry,
} from "../../utils/changeLog";
import {
  normalizePartNumbers,
  toPartNumberDocId,
  toPartNumberSummary,
} from "../../utils/partNumbers";

const savePulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(47, 125, 49, 0.22); }
  40% { transform: scale(1.005); box-shadow: 0 0 0 8px rgba(47, 125, 49, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(47, 125, 49, 0); }
`;

const compileEquipmentWorkOrders = (equipmentList) =>
  equipmentList
    .map((equipmentItem) => {
      const workOrder = (equipmentItem.workOrder || "").trim();
      if (!workOrder) {
        return null;
      }

      return `${workOrder}: ${equipmentItem.model || ""} - ${equipmentItem.stock || ""}`;
    })
    .filter(Boolean)
    .join(" / ");

export default function EquipmentRow(props) {
  const RETRY_ACTIONS = {
    SAVE_EQUIPMENT: "save_equipment",
    DELETE_EQUIPMENT: "delete_equipment",
  };
  const { request, item, readOnly = false } = props;
  const [{ userProfile }] = useStateValue();
  const [formValues, setFormValues] = useState({
    model: "",
    stock: "",
    serial: "",
    work: "",
    notes: "",
    partNumbersList: [""],
  });
  const [originalValues, setOriginalValues] = useState({
    model: "",
    stock: "",
    serial: "",
    work: "",
    notes: "",
    partNumbersList: [""],
  });
  const [openEditSheet, setOpenEditSheet] = useState(false);
  const [isShowingConfirmDialog, setIsShowingConfirmDialog] = useState(false);
  const [isEquipmentDeletePending, setIsEquipmentDeletePending] = useState(false);
  const [equipmentDeleteSnackbarOpen, setEquipmentDeleteSnackbarOpen] = useState(false);
  const [writeErrorSnackbarOpen, setWriteErrorSnackbarOpen] = useState(false);
  const [writeErrorMessage, setWriteErrorMessage] = useState("");
  const [retryAction, setRetryAction] = useState("");
  const [showSavePulse, setShowSavePulse] = useState(false);
  const equipmentDeleteTimeoutRef = useRef(null);
  const fullName = `${userProfile?.firstName} ${userProfile?.lastName}`;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const equipmentHasChanges = useMemo(
    () =>
      originalValues.model !== formValues.model ||
      originalValues.stock !== formValues.stock ||
      originalValues.serial !== formValues.serial ||
      originalValues.work !== formValues.work ||
      originalValues.notes !== formValues.notes ||
      normalizePartNumbers(originalValues.partNumbersList).join("|") !==
        normalizePartNumbers(formValues.partNumbersList).join("|"),
    [originalValues, formValues]
  );

  // Dialog shortcut listeners are scoped to mounted equipment rows.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    return () => {
      if (equipmentDeleteTimeoutRef.current) {
        clearTimeout(equipmentDeleteTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const onShortcutSave = () => {
      if (openEditSheet && !isShowingConfirmDialog) {
        saveEquipment();
      }
    };

    const onShortcutClose = () => {
      if (isShowingConfirmDialog) {
        handleCloseConfirmDialog();
        return;
      }

      if (openEditSheet) {
        handleCloseEditSheet();
      }
    };

    window.addEventListener("request-shortcut-save", onShortcutSave);
    window.addEventListener("request-shortcut-close", onShortcutClose);

    return () => {
      window.removeEventListener("request-shortcut-save", onShortcutSave);
      window.removeEventListener("request-shortcut-close", onShortcutClose);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openEditSheet, isShowingConfirmDialog, formValues, originalValues]);

  const handleOpenEditSheet = async () => {
    let existingPartNumbers = [""];
    try {
      const partNumbersSnapshot = await getDocs(
        collection(
          db,
          "branches",
          userProfile.branch,
          "requests",
          item.requestID,
          "equipment",
          item.stock,
          "partNumbers",
        ),
      );
      const parsed = partNumbersSnapshot.docs
        .map((partDoc) => partDoc.data().partNumber || "")
        .filter(Boolean);
      existingPartNumbers = parsed.length > 0 ? parsed : [""];
    } catch (error) {
      existingPartNumbers = [""];
    }

    const currentValues = {
      model: item.model,
      stock: item.stock,
      serial: item.serial,
      work: item.work,
      notes: item.notes,
      partNumbersList: existingPartNumbers,
    };

    setOriginalValues(currentValues);
    setFormValues(currentValues);
    setOpenEditSheet(true);
  };

  const handleCloseEditSheet = () => {
    setOpenEditSheet(false);
  };

  const handleCloseConfirmDialog = () => {
    setIsShowingConfirmDialog(false);
  };

  const handleToggleConfirmDialog = () => {
    setIsShowingConfirmDialog(!isShowingConfirmDialog);
  };

  const handleFieldChange = (field, value) => {
    setFormValues((previousValues) => ({
      ...previousValues,
      [field]: value,
    }));
  };

  const handlePartNumberRowChange = (index, value) => {
    setFormValues((previousValues) => {
      const nextPartNumbers = [...(previousValues.partNumbersList || [""])];
      nextPartNumbers[index] = value.toUpperCase();
      return {
        ...previousValues,
        partNumbersList: nextPartNumbers,
      };
    });
  };

  const handleAddPartNumberRow = () => {
    setFormValues((previousValues) => ({
      ...previousValues,
      partNumbersList: [...(previousValues.partNumbersList || [""]), ""],
    }));
  };

  const handleRemovePartNumberRow = (index) => {
    setFormValues((previousValues) => {
      const current = previousValues.partNumbersList || [""];
      if (current.length <= 1) {
        return {
          ...previousValues,
          partNumbersList: [""],
        };
      }
      return {
        ...previousValues,
        partNumbersList: current.filter((_, rowIndex) => rowIndex !== index),
      };
    });
  };

  const saveEquipment = async () => {
    if (!equipmentHasChanges) {
      setOpenEditSheet(false);
      return;
    }

    const changeDetails = [];

    if (originalValues.model !== formValues.model) {
      changeDetails.push(
        `equipment model updated from ${originalValues.model} to ${formValues.model}`
      );
    }

    if (originalValues.stock !== formValues.stock) {
      changeDetails.push(
        `equipment stock number updated from ${originalValues.stock} to ${formValues.stock}`
      );
    }

    if (originalValues.serial !== formValues.serial) {
      changeDetails.push(
        `equipment serial number updated from ${originalValues.serial} to ${formValues.serial}`
      );
    }

    if (originalValues.work !== formValues.work) {
      changeDetails.push(
        `equipment work required updated from ${originalValues.work} to ${formValues.work}`
      );
    }

    if (originalValues.notes !== formValues.notes) {
      changeDetails.push(
        `equipment notes from ${
          originalValues.notes === "" ? "blank" : originalValues.notes
        } to ${formValues.notes}`
      );
    }
    const originalPartNumbers = normalizePartNumbers(originalValues.partNumbersList);
    const nextPartNumbers = normalizePartNumbers(formValues.partNumbersList);
    const originalStock = item.stock;
    const nextStock = formValues.stock;
    const stockChanged = originalStock !== nextStock;
    if (originalPartNumbers.join("|") !== nextPartNumbers.join("|")) {
      changeDetails.push("equipment part numbers updated");
    }

    try {
      const changeLogEntry = createChangeLogEntry({
        user: fullName,
        actionType: CHANGE_ACTIONS.EQUIPMENT_UPDATED,
        summary: "Equipment details updated",
        details: changeDetails,
      });

      const nextEquipmentChangeLog = [...(item.changeLog || []), changeLogEntry];
      const originalEquipmentSnapshot = await getDoc(
        doc(
          db,
          "branches",
          userProfile.branch,
          "requests",
          item.requestID,
          "equipment",
          originalStock,
        ),
      );
      const originalEquipmentData = originalEquipmentSnapshot.exists()
        ? originalEquipmentSnapshot.data()
        : {};

      await setDoc(
        doc(
          db,
          "branches",
          userProfile.branch,
          "requests",
          item.requestID,
          "equipment",
          nextStock
        ),
        {
          model: formValues.model,
          stock: nextStock,
          serial: formValues.serial,
          workOrder: item.workOrder || originalEquipmentData.workOrder || "",
          work: formValues.work,
          notes: formValues.notes,
          partNumbersSummary: toPartNumberSummary(nextPartNumbers),
          changeLog: nextEquipmentChangeLog,
          timestamp:
            item.timestamp ||
            originalEquipmentData.timestamp ||
            new Date().toISOString(),
          requestID: item.requestID || originalEquipmentData.requestID,
        },
        { merge: true }
      );

      const partNumbersCollectionRef = collection(
        db,
        "branches",
        userProfile.branch,
        "requests",
        item.requestID,
        "equipment",
        nextStock,
        "partNumbers",
      );
      const existingPartNumbersSnapshot = await getDocs(partNumbersCollectionRef);
      const existingPartNumbersById = new Map(
        existingPartNumbersSnapshot.docs.map((partDoc) => [
          partDoc.id,
          partDoc.data().partNumber || "",
        ]),
      );
      const nextPartNumberIds = new Set(
        nextPartNumbers.map((partNumber) => toPartNumberDocId(partNumber)),
      );

      for (const [docId] of existingPartNumbersById.entries()) {
        if (!nextPartNumberIds.has(docId)) {
          await deleteDoc(
            doc(
              db,
              "branches",
              userProfile.branch,
              "requests",
              item.requestID,
              "equipment",
              nextStock,
              "partNumbers",
              docId,
            ),
          );
        }
      }

      for (const partNumber of nextPartNumbers) {
        await setDoc(
          doc(
            db,
            "branches",
            userProfile.branch,
            "requests",
            item.requestID,
            "equipment",
            nextStock,
            "partNumbers",
            toPartNumberDocId(partNumber),
          ),
          {
            partNumber,
            requestID: item.requestID,
            equipmentStock: nextStock,
          },
          { merge: true },
        );
      }

      if (stockChanged) {
        const legacyPartsSnapshot = await getDocs(
          collection(
            db,
            "branches",
            userProfile.branch,
            "requests",
            item.requestID,
            "equipment",
            originalStock,
            "partNumbers",
          ),
        );

        await Promise.all(
          legacyPartsSnapshot.docs.map((partDoc) =>
            deleteDoc(
              doc(
                db,
                "branches",
                userProfile.branch,
                "requests",
                item.requestID,
                "equipment",
                originalStock,
                "partNumbers",
                partDoc.id,
              ),
            ),
          ),
        );

        await deleteDoc(
          doc(
            db,
            "branches",
            userProfile.branch,
            "requests",
            item.requestID,
            "equipment",
            originalStock,
          ),
        );
      }

      const refreshedEquipmentSnapshot = await getDocs(
        collection(
          db,
          "branches",
          userProfile.branch,
          "requests",
          item.requestID,
          "equipment",
        ),
      );
      const refreshedEquipment = refreshedEquipmentSnapshot.docs.map(
        (equipmentDocument) => equipmentDocument.data(),
      );
      const hasEquipmentWorkOrders = refreshedEquipment.some((equipmentItem) =>
        Boolean((equipmentItem.workOrder || "").trim()),
      );

      if (hasEquipmentWorkOrders) {
        await setDoc(
          doc(db, "branches", userProfile.branch, "requests", item.requestID),
          {
            workOrder: compileEquipmentWorkOrders(refreshedEquipment),
          },
          { merge: true },
        );
      }

      sendEquipmentUpdateEmail(
        originalValues,
        request,
        userProfile,
        fullName,
        formValues.model,
        formValues.stock,
        formValues.serial,
        formValues.work,
        formValues.notes
      );

      setShowSavePulse(true);
      setTimeout(() => {
        setShowSavePulse(false);
      }, 650);
      setOpenEditSheet(false);
    } catch (error) {
      showWriteError(
        "Could not save equipment changes. Please retry.",
        RETRY_ACTIONS.SAVE_EQUIPMENT
      );
    }
  };

  const deleteEquipmentNow = async () => {
    const nextRequestChangeLog = [...(request.changeLog || [])];
    nextRequestChangeLog.push(
      createChangeLogEntry({
        user: fullName,
        actionType: CHANGE_ACTIONS.EQUIPMENT_DELETED,
        summary: `${item.model} ST# ${item.stock} deleted from the request`,
      })
    );

    await setDoc(
      doc(db, "branches", userProfile.branch, "requests", item.requestID),
      {
        changeLog: nextRequestChangeLog,
      },
      { merge: true }
    );

    await deleteDoc(
      doc(
        db,
        "branches",
        userProfile.branch,
        "requests",
        item.requestID,
        "equipment",
        item.stock
      )
    );

    sendEquipmentDeletedEmail(item, request, fullName, userProfile);
  };

  const deleteEquipment = () => {
    setIsShowingConfirmDialog(false);
    setOpenEditSheet(false);
    setIsEquipmentDeletePending(true);
    setEquipmentDeleteSnackbarOpen(true);

    equipmentDeleteTimeoutRef.current = setTimeout(async () => {
      try {
        await deleteEquipmentNow();
      } catch (error) {
        setIsEquipmentDeletePending(false);
        showWriteError(
          "Delete failed. Equipment row was restored. Retry?",
          RETRY_ACTIONS.DELETE_EQUIPMENT
        );
      } finally {
        setEquipmentDeleteSnackbarOpen(false);
      }
    }, 5000);
  };

  const undoEquipmentDelete = () => {
    if (equipmentDeleteTimeoutRef.current) {
      clearTimeout(equipmentDeleteTimeoutRef.current);
      equipmentDeleteTimeoutRef.current = null;
    }
    setIsEquipmentDeletePending(false);
    setEquipmentDeleteSnackbarOpen(false);
  };

  const showWriteError = (message, action) => {
    setWriteErrorMessage(message);
    setRetryAction(action);
    setWriteErrorSnackbarOpen(true);
  };

  const closeWriteErrorSnackbar = () => {
    setWriteErrorSnackbarOpen(false);
  };

  const retryFailedWrite = () => {
    setWriteErrorSnackbarOpen(false);
    if (retryAction === RETRY_ACTIONS.SAVE_EQUIPMENT) {
      saveEquipment();
      return;
    }

    if (retryAction === RETRY_ACTIONS.DELETE_EQUIPMENT) {
      deleteEquipment();
    }
  };

  return (
    <React.Fragment>
      {!isEquipmentDeletePending ? (
      <TableRow
        key={item.requestID}
        style={{ fontSize: 18 }}
        sx={{
          "& > *": { borderBottom: "unset" },
          animation: showSavePulse ? `${savePulse} 650ms ease-out` : "none",
        }}
      >
        <TableCell key="model" align="left" component="th" scope="row">
          {item.model}
        </TableCell>

        <TableCell key="serial" align="left">
          {`Stock: ${item.stock}`}
          <p>
            <small>{`Serial: ${item.serial}`}</small>
          </p>
        </TableCell>

        <TableCell key="workOrder" align="left">
          {item.workOrder || "-"}
        </TableCell>

        <TableCell key="work" align="left">
          {item.work}
        </TableCell>

        <TableCell key="partNumbers" align="left">
          {item.partNumbersSummary || "-"}
        </TableCell>

        <TableCell key="notes" align="left">
          {item.notes}
        </TableCell>

        <TableCell key="editSaveCancelbutton" align="center">
          {readOnly ? null : (
            <IconButton
              color="primary"
              style={{ fontSize: 20 }}
              aria-label={`Edit equipment ${item.model} ${item.stock}`}
              onClick={handleOpenEditSheet}
            >
              <Tooltip title="Edit Equipment">
                <EditRounded color="primary" style={{ fontSize: 18 }} />
              </Tooltip>
            </IconButton>
          )}
        </TableCell>
      </TableRow>
      ) : null}

      <Dialog
        onClose={handleCloseEditSheet}
        open={openEditSheet}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
            Edit Equipment
          </Typography>

          <Stack spacing={1.5}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                fullWidth
                size="small"
                label="Model"
                value={formValues.model}
                onChange={(event) =>
                  handleFieldChange("model", event.target.value.toUpperCase())
                }
              />
              <TextField
                fullWidth
                size="small"
                label="Stock"
                value={formValues.stock}
                onChange={(event) => handleFieldChange("stock", event.target.value)}
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                fullWidth
                size="small"
                label="Serial"
                value={formValues.serial}
                onChange={(event) =>
                  handleFieldChange("serial", event.target.value.toUpperCase())
                }
              />
              <TextField
                fullWidth
                size="small"
                label="Work"
                value={formValues.work}
                onChange={(event) => handleFieldChange("work", event.target.value)}
              />
            </Stack>

            <TextField
              fullWidth
              size="small"
              label="Notes"
              value={formValues.notes}
              onChange={(event) => handleFieldChange("notes", event.target.value)}
            />
            <Stack spacing={1}>
              <Typography variant="subtitle2">Part Numbers</Typography>
              {(formValues.partNumbersList || [""]).map((partNumber, index) => (
                <Stack
                  key={`equipment-edit-part-${index}`}
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                >
                  <TextField
                    fullWidth
                    size="small"
                    label={`Part Number ${index + 1}`}
                    value={partNumber}
                    onChange={(event) =>
                      handlePartNumberRowChange(index, event.target.value)
                    }
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    onClick={() => handleRemovePartNumberRow(index)}
                    disabled={
                      (formValues.partNumbersList || [""]).length === 1 &&
                      !partNumber
                    }
                  >
                    Remove
                  </Button>
                </Stack>
              ))}
              <Box>
                <Button size="small" variant="text" onClick={handleAddPartNumberRow}>
                  Add Part Number
                </Button>
              </Box>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1} justifyContent="space-between" sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteRounded />}
              onClick={handleToggleConfirmDialog}
            >
              Delete Equipment
            </Button>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={handleCloseEditSheet}>
                Cancel
              </Button>
              <Button variant="contained" onClick={saveEquipment} disabled={!equipmentHasChanges}>
                Save Changes
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Dialog>

      <Dialog onClose={handleCloseConfirmDialog} open={isShowingConfirmDialog}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            margin: "5px 25px 25px 25px",
          }}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <div>
            <Typography>Are you sure you want to delete</Typography>
            <Typography>{`${item.model} from this request?`}</Typography>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: "25px",
              }}
            >
              <Button variant="outlined" color="primary" onClick={handleCloseConfirmDialog}>
                Cancel
              </Button>
              <Button variant="contained" color="error" onClick={deleteEquipment}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      <Snackbar
        open={equipmentDeleteSnackbarOpen}
        autoHideDuration={5000}
        onClose={() => setEquipmentDeleteSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={undoEquipmentDelete}>
              Undo
            </Button>
          }
        >
          Equipment deleted. Undo?
        </Alert>
      </Snackbar>

      <Snackbar
        open={writeErrorSnackbarOpen}
        autoHideDuration={7000}
        onClose={closeWriteErrorSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="error"
          onClose={closeWriteErrorSnackbar}
          action={
            <Button color="inherit" size="small" onClick={retryFailedWrite}>
              Retry
            </Button>
          }
        >
          {writeErrorMessage}
        </Alert>
      </Snackbar>
    </React.Fragment>
  );
}
