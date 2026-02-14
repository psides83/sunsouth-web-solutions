import React, { useCallback, useEffect, useRef, useState } from "react";
import { useStateValue } from "../../state-management/StateProvider";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  setDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import moment from "moment";
import "../../styles/Table.css";
import { EquipmentTableHeaderView } from "../../components/TableHeaderViews";
import {
  sendWorkOrderEmail,
  sendNewEquipmentEmail,
  sendStatusEmail,
  sendRequestDeletedEmail,
} from "../../services/email-service";
import EquipmentRow from "./EquipmentRows";
import { Link } from "react-router-dom";
import Spinner from "../../components/Spinner";
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogTitle,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  AddRounded,
  DeleteRounded,
  EditRounded,
  HistoryOutlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
  PrintOutlined,
} from "@mui/icons-material";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
} from "@mui/lab";
import { keyframes } from "@mui/system";
import {
  formatRelativeTimestamp,
  formatTimestampWithRelative,
} from "../../utils/dateTime";
import {
  CHANGE_ACTION_FILTER_ALL,
  CHANGE_ACTIONS,
  createChangeLogEntry,
  getChangeLogActionOptions,
  normalizeChangeLogEntry,
} from "../../utils/changeLog";

const savePulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(47, 125, 49, 0.22); }
  40% { transform: scale(1.006); box-shadow: 0 0 0 10px rgba(47, 125, 49, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(47, 125, 49, 0); }
`;

const toWorkOrderString = (workOrder) => {
  if (typeof workOrder === "string") {
    return workOrder;
  }

  if (Array.isArray(workOrder)) {
    return workOrder.filter(Boolean).join(" / ");
  }

  if (workOrder === null || workOrder === undefined) {
    return "";
  }

  return String(workOrder);
};

export default function RequestRow({ request, disableEditing = false }) {
  const RETRY_ACTIONS = {
    SAVE_WORK_ORDER: "save_work_order",
    SAVE_EQUIPMENT: "save_equipment",
    UPDATE_STATUS: "update_status",
    DELETE_REQUEST: "delete_request",
  };
  const [{ userProfile }] = useStateValue();
  const [open, setOpen] = useState(false);
  const [equipment, setEquipment] = useState([]);
  const [equipmentWorkOrders, setEquipmentWorkOrders] = useState({});
  const [newEquipment, setNewEquipment] = useState({
    model: "",
    stock: "",
    serial: "",
    work: "",
    notes: "",
  });
  const fullName = `${userProfile?.firstName} ${userProfile?.lastName}`;
  const [openChangeLog, setOpenChangeLog] = useState(false);
  const [historyActionFilter, setHistoryActionFilter] = useState(
    CHANGE_ACTION_FILTER_ALL
  );
  const [isShowingConfirmDialog, setIsShowingConfirmDialog] = useState(false);
  const [isShowingDeleteDialog, setIsShowingDeleteDialog] = useState(false);
  const [isShowingSpinner, setIsShowingSpinner] = useState(false);
  const [showSavePulse, setShowSavePulse] = useState(false);
  const [isRequestDeletePending, setIsRequestDeletePending] = useState(false);
  const [requestDeleteSnackbarOpen, setRequestDeleteSnackbarOpen] = useState(false);
  const [writeErrorSnackbarOpen, setWriteErrorSnackbarOpen] = useState(false);
  const [writeErrorMessage, setWriteErrorMessage] = useState("");
  const [retryAction, setRetryAction] = useState("");
  const [openWorkOrderSheet, setOpenWorkOrderSheet] = useState(false);
  const [openAddEquipmentSheet, setOpenAddEquipmentSheet] = useState(false);
  const requestDeleteTimeoutRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const normalizedChangeLog = (request?.changeLog || []).map(
    normalizeChangeLogEntry
  );
  const lastChangeEntry =
    normalizedChangeLog.length > 0
      ? normalizedChangeLog[normalizedChangeLog.length - 1]
      : null;
  const historyActionOptions = getChangeLogActionOptions(normalizedChangeLog);
  const visibleChangeLog =
    historyActionFilter === CHANGE_ACTION_FILTER_ALL
      ? normalizedChangeLog
      : normalizedChangeLog.filter(
          (change) => change.actionType === historyActionFilter
        );

  const getStatusChipProps = (status) => {
    switch (status) {
      case "Requested":
        return { color: "primary", variant: "outlined" };
      case "Scheduled":
        return { color: "secondary", variant: "filled" };
      case "In Progress":
        return { color: "primary", variant: "filled" };
      case "Completed":
        return { color: "success", variant: "filled" };
      default:
        return { color: "default", variant: "outlined" };
    }
  };

  const handleCloseChangeLog = () => {
    setOpenChangeLog(false);
    setHistoryActionFilter(CHANGE_ACTION_FILTER_ALL);
  };

  const handleToggleChangeLog = () => {
    setOpenChangeLog(!openChangeLog);
    if (!openChangeLog) {
      setHistoryActionFilter(CHANGE_ACTION_FILTER_ALL);
    }
  };

  const handleCloseConfirmDialog = () => {
    setIsShowingConfirmDialog(false);
  };

  const handleToggleConfirmDialog = () => {
    setIsShowingConfirmDialog(!isShowingConfirmDialog);
  };

  const handleCloseDeleteDialog = () => {
    setIsShowingDeleteDialog(false);
  };

  const handleToggleDeleteDialog = () => {
    setIsShowingDeleteDialog(!isShowingDeleteDialog);
  };

  const fetchEquipment = useCallback(() => {
    const equipmentQuery = query(
      collection(
        db,
        "branches",
        userProfile?.branch,
        "requests",
        request.id,
        "equipment",
      ),
      orderBy("timestamp", "asc"),
    );

    onSnapshot(equipmentQuery, (querySnapshot) => {
      setEquipment(
        querySnapshot.docs.map((document) => ({
          requestID: document.data().requestID,
          model: document.data().model.toString().toUpperCase(),
          stock: document.data().stock,
          serial: document.data().serial.toString().toUpperCase(),
          workOrder: document.data().workOrder || "",
          work: document.data().work,
          notes: document.data().notes,
          changeLog: document.data().changeLog,
        })),
      );
    });
  }, [request.id, userProfile.branch]);

  // Row-level shortcut listeners rely on current open-state flags.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const triggerSavePulse = () => {
    setShowSavePulse(true);
    setTimeout(() => {
      setShowSavePulse(false);
    }, 650);
  };

  useEffect(() => {
    const onShortcutSave = () => {
      if (openWorkOrderSheet) {
        saveWorkOrder();
        return;
      }

      if (openAddEquipmentSheet) {
        saveNewEquipment();
        return;
      }

      if (isShowingConfirmDialog) {
        updateStatus();
      }
    };

    const onShortcutClose = () => {
      if (openAddEquipmentSheet) {
        handleCloseAddEquipmentSheet();
        return;
      }

      if (openWorkOrderSheet) {
        handleCloseWorkOrderSheet();
        return;
      }

      if (isShowingDeleteDialog) {
        handleCloseDeleteDialog();
        return;
      }

      if (isShowingConfirmDialog) {
        handleCloseConfirmDialog();
        return;
      }

      if (openChangeLog) {
        handleCloseChangeLog();
      }
    };

    window.addEventListener("request-shortcut-save", onShortcutSave);
    window.addEventListener("request-shortcut-close", onShortcutClose);

    return () => {
      window.removeEventListener("request-shortcut-save", onShortcutSave);
      window.removeEventListener("request-shortcut-close", onShortcutClose);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    openWorkOrderSheet,
    openAddEquipmentSheet,
    isShowingConfirmDialog,
    isShowingDeleteDialog,
    openChangeLog,
    equipment,
    equipmentWorkOrders,
  ]);

  useEffect(() => {
    return () => {
      if (requestDeleteTimeoutRef.current) {
        clearTimeout(requestDeleteTimeoutRef.current);
      }
    };
  }, []);

  const handleOpenWorkOrderSheet = () => {
    const nextWorkOrders = {};
    equipment.forEach((item) => {
      nextWorkOrders[item.stock] = item.workOrder || "";
    });
    setEquipmentWorkOrders(nextWorkOrders);
    setOpenWorkOrderSheet(true);
  };

  const handleCloseWorkOrderSheet = () => {
    setOpenWorkOrderSheet(false);
  };

  const compileRequestWorkOrder = (equipmentList, workOrderMap) => {
    return equipmentList
      .map((item) => {
        const workOrder = (workOrderMap[item.stock] || "").trim();
        if (!workOrder) {
          return null;
        }

        return `${workOrder}: ${item.model} - ${item.stock}`;
      })
      .filter(Boolean)
      .join(" / ");
  };

  const saveWorkOrder = async () => {
    try {
      const hasWorkOrderChanges = equipment.some(
        (item) =>
          (item.workOrder || "").trim() !==
          (equipmentWorkOrders[item.stock] || "").trim(),
      );

      if (!hasWorkOrderChanges) {
        setOpenWorkOrderSheet(false);
        return;
      }

      const compiledWorkOrder = compileRequestWorkOrder(equipment, equipmentWorkOrders);
      const hadEquipmentWorkOrders = equipment.some((item) =>
        Boolean((item.workOrder || "").trim()),
      );
      const nextRequestWorkOrder =
        !compiledWorkOrder && !hadEquipmentWorkOrders
          ? request.workOrder || ""
          : compiledWorkOrder;
      const workOrderStatus = compiledWorkOrder
        ? "Updated equipment work orders"
        : "Cleared equipment work orders";

      const changeLogEntry = createChangeLogEntry({
        user: fullName,
        actionType: CHANGE_ACTIONS.WORK_ORDER_UPDATED,
        summary: workOrderStatus,
      });

      const nextChangeLog = [...(request.changeLog || []), changeLogEntry];

      await Promise.all(
        equipment.map((item) =>
          setDoc(
            doc(
              db,
              "branches",
              userProfile.branch,
              "requests",
              request.id,
              "equipment",
              item.stock,
            ),
            {
              workOrder: (equipmentWorkOrders[item.stock] || "").trim(),
            },
            { merge: true },
          ),
        ),
      );

      await setDoc(
        doc(db, "branches", userProfile.branch, "requests", request.id),
        {
          workOrder: nextRequestWorkOrder,
          changeLog: nextChangeLog,
        },
        { merge: true },
      );

      sendWorkOrderEmail(
        equipment,
        request,
        nextRequestWorkOrder,
        fullName,
        "",
        userProfile,
      );
      triggerSavePulse();
      setOpenWorkOrderSheet(false);
    } catch (error) {
      showWriteError(
        "Could not save work order updates. Please retry.",
        RETRY_ACTIONS.SAVE_WORK_ORDER
      );
    }
  };

  const handleOpenAddEquipmentSheet = () => {
    setNewEquipment({
      model: "",
      stock: "",
      serial: "",
      work: "",
      notes: "",
    });
    setOpenAddEquipmentSheet(true);
  };

  const handleCloseAddEquipmentSheet = () => {
    setOpenAddEquipmentSheet(false);
  };

  const handleEquipmentFieldChange = (field, value) => {
    setNewEquipment((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const saveNewEquipment = async () => {
    try {
      const timestamp = moment().format("DD-MMM-yyyy hh:mmA");
      const { model, stock, serial, work, notes } = newEquipment;

      if (model === "" || stock === "" || serial === "" || work === "") {
        return;
      }

      const changeLog = [
        createChangeLogEntry({
          user: fullName,
          actionType: CHANGE_ACTIONS.EQUIPMENT_ADDED,
          summary: "Equipment record created",
          timestamp,
        }),
      ];

      const createdEquipment = {
        requestID: request.id,
        timestamp,
        model,
        stock,
        serial,
        work,
        notes,
        changeLog,
      };

      const equipmentRef = doc(
        db,
        "branches",
        userProfile.branch,
        "requests",
        request.id,
        "equipment",
        createdEquipment.stock,
      );
      await setDoc(equipmentRef, createdEquipment, { merge: true });

      const changeLogEntry = createChangeLogEntry({
        user: fullName,
        actionType: CHANGE_ACTIONS.EQUIPMENT_ADDED,
        summary: `Equipment model ${model} added to the request`,
      });

      const nextChangeLog = [...(request.changeLog || []), changeLogEntry];

      const requestRef = doc(
        db,
        "branches",
        userProfile.branch,
        "requests",
        request.id,
      );
      await setDoc(requestRef, { changeLog: nextChangeLog }, { merge: true });

      sendNewEquipmentEmail(
        request,
        equipment,
        timestamp,
        fullName,
        model,
        stock,
        serial,
        work,
        notes,
        userProfile,
      );

      triggerSavePulse();
      setOpenAddEquipmentSheet(false);
    } catch (error) {
      showWriteError(
        "Could not add equipment. Please retry.",
        RETRY_ACTIONS.SAVE_EQUIPMENT
      );
    }
  };

  const updateStatus = async () => {
    setIsShowingSpinner(true);
    try {
      let status = request.status;

      switch (status) {
        case "Requested":
          status = "In Progress";
          break;
        case "In Progress":
          status = "Completed";
          break;
        default:
          status = "Completed";
      }

      const changeLogEntry = createChangeLogEntry({
        user: fullName,
        actionType: CHANGE_ACTIONS.STATUS_UPDATED,
        summary: `Status updated to ${status}`,
      });

      const nextChangeLog = [...(request.changeLog || []), changeLogEntry];
      const requestRef = doc(
        db,
        "branches",
        userProfile.branch,
        "requests",
        request.id,
      );
      await setDoc(
        requestRef,
        {
          status,
          statusTimestamp: moment().format("DD-MMM-yyyy h:mmA"),
          changeLog: nextChangeLog,
        },
        {
          merge: true,
        },
      );

      sendStatusEmail(status, equipment, request, fullName, userProfile);
      handleCloseConfirmDialog();
      triggerSavePulse();
    } catch (error) {
      showWriteError(
        "Could not update request status. Please retry.",
        RETRY_ACTIONS.UPDATE_STATUS
      );
    } finally {
      setTimeout(() => {
        setIsShowingSpinner(false);
      }, 1000);
    }
  };

  const setPDFData = () => {
    const requestRef = doc(db, "users", userProfile?.id, "pdf", "pdfData");
    setDoc(
      requestRef,
      {
        request,
        equipment,
      },
      {
        merge: true,
      },
    );
  };

  const statusUpdateText = () => {
    if (request.status === "Requested") {
      return "In Progress";
    }
    if (request.status === "In Progress") {
      return "Completed";
    }
    return "Requested";
  };

  const deleteRequestNow = async () => {
    await deleteDoc(
      doc(db, "branches", userProfile.branch, "requests", request.id),
    );
    sendRequestDeletedEmail(equipment, request, fullName, userProfile);
  };

  const deleteRequest = () => {
    handleCloseDeleteDialog();
    handleCloseWorkOrderSheet();
    setIsRequestDeletePending(true);
    setRequestDeleteSnackbarOpen(true);

    requestDeleteTimeoutRef.current = setTimeout(async () => {
      try {
        await deleteRequestNow();
      } catch (error) {
        setIsRequestDeletePending(false);
        showWriteError(
          "Delete failed. Request was restored. Retry?",
          RETRY_ACTIONS.DELETE_REQUEST
        );
      } finally {
        setRequestDeleteSnackbarOpen(false);
      }
    }, 5000);
  };

  const undoRequestDelete = () => {
    if (requestDeleteTimeoutRef.current) {
      clearTimeout(requestDeleteTimeoutRef.current);
      requestDeleteTimeoutRef.current = null;
    }
    setIsRequestDeletePending(false);
    setRequestDeleteSnackbarOpen(false);
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
    switch (retryAction) {
      case RETRY_ACTIONS.SAVE_WORK_ORDER:
        saveWorkOrder();
        break;
      case RETRY_ACTIONS.SAVE_EQUIPMENT:
        saveNewEquipment();
        break;
      case RETRY_ACTIONS.UPDATE_STATUS:
        updateStatus();
        break;
      case RETRY_ACTIONS.DELETE_REQUEST:
        deleteRequest();
        break;
      default:
        break;
    }
  };

  return (
    <React.Fragment>
      {!isRequestDeletePending ? (
        <>
      <TableRow
        key={request.id}
        data-request-main-row="true"
        sx={{
          "& > *": { borderBottom: "unset" },
          animation: showSavePulse ? `${savePulse} 650ms ease-out` : "none",
        }}
      >
        <TableCell key="expand">
          <Tooltip title={open ? "Hide Equipment" : "Show Equipment"}>
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
            >
              {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </Tooltip>
        </TableCell>

        <TableCell key="model" align="left">
          <Typography sx={{ fontWeight: "bold" }}>
            {equipment[0]?.model}
          </Typography>
          <p>
            <small>
              {equipment.length > 1 ? `and ${equipment.length - 1} more` : ""}
            </small>
          </p>
        </TableCell>

        <TableCell key="salesman" align="left" scope="row">
          <Typography component="p">{request.salesman}</Typography>
          <Typography variant="caption">
            {formatTimestampWithRelative(request.timestamp)}
          </Typography>
        </TableCell>

        <TableCell key="workOrder" align="left">
          {toWorkOrderString(request.workOrder)
            .split(" / ")
            .filter(Boolean)
            .map((line, index) => (
              <Typography
                key={`wo-${request.id}-${index}`}
                variant="caption"
                sx={{ display: "block" }}
              >
                {line}
              </Typography>
            ))}
          {toWorkOrderString(request.workOrder) ? null : "-"}
        </TableCell>

        <TableCell key="status" align="left">
          <Tooltip title="Update Status">
            <Chip
              size="small"
              label={request.status}
              clickable
              onClick={handleToggleConfirmDialog}
              sx={{
                minWidth: 115,
                fontWeight: 600,
                justifyContent: "center",
              }}
              {...getStatusChipProps(request.status)}
            />
          </Tooltip>
          <Typography component="p" variant="caption" color="text.secondary">
            {`Last updated by ${lastChangeEntry?.user || "Unknown"}${
              lastChangeEntry?.timestamp
                ? ` ${formatRelativeTimestamp(lastChangeEntry.timestamp)}`
                : ""
            }`}
          </Typography>
          <Typography component="p" variant="caption" color="text.secondary">
            {lastChangeEntry?.timestamp || "No update history"}
          </Typography>

          <Dialog
            onClose={handleCloseConfirmDialog}
            open={isShowingConfirmDialog}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                margin: "5px 25px 25px 25px",
              }}
            >
              <DialogTitle>Confirm Update</DialogTitle>
              {isShowingSpinner ? (
                <div
                  style={{
                    justifyContent: "center",
                    alignContent: "center",
                    justifySelf: "center",
                    alignSelf: "center",
                  }}
                >
                  <Typography>Saving</Typography>
                  <Spinner frame={false} />
                </div>
              ) : (
                <div>
                  <Typography>Update the request&apos;s status from</Typography>
                  <Typography>{`"${request.status}" to "${statusUpdateText()}"?`}</Typography>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginTop: "25px",
                    }}
                  >
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleCloseConfirmDialog}
                    >
                      Cancel
                    </Button>
                    <Button variant="contained" onClick={updateStatus}>
                      Update
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Dialog>
        </TableCell>

        <TableCell
          key="buttons"
          align="center"
          sx={{
            position: "sticky",
            right: 0,
            zIndex: 2,
            bgcolor: "background.paper",
            borderLeft: "1px solid",
            borderColor: "divider",
            px: 0.5,
          }}
        >
          <Stack direction="row" spacing={0.25} justifyContent="center">
            <IconButton
              aria-label={`Show request history ${request.id}`}
              onClick={handleToggleChangeLog}
              size="small"
              sx={{ p: 0.75 }}
            >
              <Tooltip title="Show Changes">
                <HistoryOutlined />
              </Tooltip>
            </IconButton>

            <Dialog
              onClose={handleCloseChangeLog}
              open={openChangeLog}
              fullWidth
              maxWidth="sm"
              PaperProps={{
                sx: {
                  height: { xs: "78vh", sm: 560 },
                  maxHeight: "78vh",
                },
              }}
            >
              <DialogTitle>Request Change History</DialogTitle>
              <Box sx={{ px: 2, pb: 1 }}>
                <TextField
                  size="small"
                  select
                  fullWidth
                  label="Action Type"
                  value={historyActionFilter}
                  onChange={(event) => setHistoryActionFilter(event.target.value)}
                >
                  {historyActionOptions.map((option) => (
                    <MenuItem key={`history-filter-${option.value}`} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box sx={{ px: 1.25, pb: 1.5, height: "100%", overflowY: "auto" }}>
                <Timeline position="alternate">
                  {visibleChangeLog.map((change, index) => (
                    <TimelineItem key={`${change.timestamp}-${change.user}-${index}`}>
                      <TimelineSeparator>
                        <TimelineDot variant="outlined" color="primary" />
                        {index + 1 !== visibleChangeLog.length ? (
                          <TimelineConnector />
                        ) : null}
                      </TimelineSeparator>
                      <TimelineContent>
                        <p>
                          <small>{formatTimestampWithRelative(change.timestamp)}</small>
                        </p>
                        <small>{change.user}</small>
                        <p>
                          <small>{change.summary}</small>
                        </p>
                        {change.details.length > 0
                          ? change.details.map((detail, detailIndex) => (
                              <p key={`${change.timestamp}-detail-${detailIndex}`}>
                                <small>{detail}</small>
                              </p>
                            ))
                          : null}
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </Box>
            </Dialog>

            <Link
              target="_blank"
              rel="noopener noreferrer"
              to="request-pdf"
              onClick={setPDFData}
            >
              <IconButton aria-label={`Print request ${request.id}`} size="small" sx={{ p: 0.75 }}>
                <Tooltip title="Print">
                  <PrintOutlined />
                </Tooltip>
              </IconButton>
            </Link>

            {disableEditing ? null : (
              <IconButton
                onClick={handleOpenWorkOrderSheet}
                data-request-edit-btn="true"
                aria-label={`Edit request work order ${request.id}`}
                size="small"
                sx={{ p: 0.75 }}
              >
                <Tooltip title="Edit Work Order">
                  <EditRounded color="primary" sx={{ fontSize: 18 }} />
                </Tooltip>
              </IconButton>
            )}
          </Stack>

          <Dialog
            onClose={handleCloseDeleteDialog}
            open={isShowingDeleteDialog}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                margin: "5px 25px 25px 25px",
              }}
            >
              <DialogTitle>Confirm Delete</DialogTitle>
              {isShowingSpinner ? (
                <div
                  style={{
                    justifyContent: "center",
                    alignContent: "center",
                    justifySelf: "center",
                    alignSelf: "center",
                  }}
                >
                  <Typography>Saving</Typography>
                  <Spinner frame={false} />
                </div>
              ) : (
                <div>
                  <Typography>Are you sure you want to delete</Typography>
                  <Typography>delete this request?</Typography>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginTop: "25px",
                    }}
                  >
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={handleCloseDeleteDialog}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={deleteRequest}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Dialog>
        </TableCell>
      </TableRow>

      <TableRow key="equipmentRow">
        <TableCell
          key="equipmentCell"
          style={{ paddingBottom: 0, paddingTop: 0 }}
          colSpan={6}
        >
          <Collapse
            in={open}
            timeout={{ enter: 260, exit: 200 }}
            easing={{
              enter: "cubic-bezier(0.2, 0, 0, 1)",
              exit: "cubic-bezier(0.4, 0, 1, 1)",
            }}
            unmountOnExit
          >
            <Box margin={1}>
              <Typography variant="subtitle1" gutterBottom component="div">
                {`Request ID: ${request.id}`}
              </Typography>
              <Table size="small" aria-label="equipment">
                <EquipmentTableHeaderView />
                <TableBody>
                  {equipment.map((item) => (
                    <EquipmentRow
                      key={item?.stock}
                      request={request}
                      item={item}
                      readOnly={disableEditing}
                    />
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
                    <TableCell colSpan={6} align="left">
                      {disableEditing ? null : (
                        <Button
                          startIcon={<AddRounded />}
                          variant="outlined"
                          size="small"
                          onClick={handleOpenAddEquipmentSheet}
                        >
                          Add Equipment
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
        </>
      ) : null}

      <Dialog
        onClose={handleCloseWorkOrderSheet}
        open={openWorkOrderSheet}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
            Edit Work Order
          </Typography>
          <Stack
            spacing={1.25}
            sx={{ maxHeight: isMobile ? "unset" : 340, overflowY: "auto", pr: 0.25 }}
          >
            {equipment.map((item) => (
              <Box key={`wo-field-${item.stock}`}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                  {`WO for: ${item.model} - ${item.stock}`}
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Work Order"
                  value={equipmentWorkOrders[item.stock] || ""}
                  onChange={(event) =>
                    setEquipmentWorkOrders((previous) => ({
                      ...previous,
                      [item.stock]: event.target.value,
                    }))
                  }
                />
              </Box>
            ))}
            {equipment.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No equipment found for this request.
              </Typography>
            ) : null}
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            justifyContent="space-between"
            sx={{ mt: 2 }}
          >
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteRounded />}
              onClick={handleToggleDeleteDialog}
            >
              Delete Request
            </Button>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={handleCloseWorkOrderSheet}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={saveWorkOrder}
                disabled={equipment.length === 0}
              >
                Save
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Dialog>

      <Dialog
        onClose={handleCloseAddEquipmentSheet}
        open={openAddEquipmentSheet}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
            Add Equipment
          </Typography>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                fullWidth
                size="small"
                label="Model"
                value={newEquipment.model}
                onChange={(event) =>
                  handleEquipmentFieldChange(
                    "model",
                    event.target.value.toUpperCase(),
                  )
                }
              />
              <TextField
                fullWidth
                size="small"
                label="Stock"
                value={newEquipment.stock}
                onChange={(event) =>
                  handleEquipmentFieldChange("stock", event.target.value)
                }
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                fullWidth
                size="small"
                label="Serial"
                value={newEquipment.serial}
                onChange={(event) =>
                  handleEquipmentFieldChange(
                    "serial",
                    event.target.value.toUpperCase(),
                  )
                }
              />
              <TextField
                fullWidth
                size="small"
                label="Work"
                value={newEquipment.work}
                onChange={(event) =>
                  handleEquipmentFieldChange("work", event.target.value)
                }
              />
            </Stack>
            <TextField
              fullWidth
              size="small"
              label="Notes"
              value={newEquipment.notes}
              onChange={(event) =>
                handleEquipmentFieldChange("notes", event.target.value)
              }
            />
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            justifyContent="flex-end"
            sx={{ mt: 2 }}
          >
            <Button variant="outlined" onClick={handleCloseAddEquipmentSheet}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={saveNewEquipment}
              disabled={
                newEquipment.model === "" ||
                newEquipment.stock === "" ||
                newEquipment.serial === "" ||
                newEquipment.work === ""
              }
            >
              Save Equipment
            </Button>
          </Stack>
        </Box>
      </Dialog>

      <Snackbar
        open={requestDeleteSnackbarOpen}
        autoHideDuration={5000}
        onClose={() => setRequestDeleteSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={undoRequestDelete}>
              Undo
            </Button>
          }
        >
          Request deleted. Undo?
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
