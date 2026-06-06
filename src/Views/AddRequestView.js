//Imports
import React, { useEffect, useRef, useState } from "react";
import { db } from "../services/firebase";
import "../styles/SignUp.css";
import { setDoc, doc } from "@firebase/firestore";
import "../styles/AddRequest.css";
import { useStateValue } from "../state-management/StateProvider";
import moment from "moment";
import { sendNewRequestEmail } from "../services/email-service";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Grid,
  Snackbar,
  Stack,
  styled,
  TextField,
  Typography,
} from "@mui/material";
import { CHANGE_ACTIONS, createChangeLogEntry } from "../utils/changeLog";
import {
  normalizePartNumbers,
  toPartNumberDocId,
  toPartNumberSummary,
} from "../utils/partNumbers";
import {
  AddCircleOutline,
  Agriculture,
  CloseRounded,
  SendRounded,
} from "@mui/icons-material";

const ListItem = styled("li")(({ theme }) => ({
  margin: theme.spacing(0.5),
}));

export default function AddRequestView({ onClose }) {
  const ADD_REQUEST_DRAFT_KEY = "draft:add-request";
  //#region State Properties
  const [{ userProfile }] = useStateValue();
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openError, setOpenError] = useState(false);
  var [model, setModel] = useState("");
  var [stock, setStock] = useState("");
  var [serial, setSerial] = useState("");
  var [work, setWork] = useState([]);
  var [notes, setNotes] = useState("");
  var [partNumbersList, setPartNumbersList] = useState([""]);
  var [other, setOther] = useState("");
  var [checked1, setChecked1] = useState(false);
  var [checked2, setChecked2] = useState(false);
  var [checked3, setChecked3] = useState(false);
  var [checked4, setChecked4] = useState(false);
  var [checked5, setChecked5] = useState(false);
  var [checked6, setChecked6] = useState(false);
  var [checked7, setChecked7] = useState(false);
  var [checked8, setChecked8] = useState(false);
  var [checked9, setChecked9] = useState(false);
  var [equipmentList, setEquepmentList] = useState([]);
  var [otherDisabled, setOtherDisabled] = useState(true);
  var [validationMessage, setValidationMessage] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    model: "",
    stock: "",
    serial: "",
    work: "",
  });
  const [openNoPartsDialog, setOpenNoPartsDialog] = useState(false);
  const noPartsDialogResolverRef = useRef(null);
  const fullName = userProfile?.firstName + " " + userProfile?.lastName;
  //#endregion

  const clearFieldError = (field) => {
    setFieldErrors((previous) => ({ ...previous, [field]: "" }));
  };

  const hasWorkSelected = () => work.some(Boolean);

  const stockIsValid = () => {
    return /^\d{6}$/.test(stock);
  };

  const validateCurrentEquipment = () => {
    const nextErrors = {
      model: "",
      stock: "",
      serial: "",
      work: "",
    };

    if (model === "") {
      nextErrors.model = "Model is required.";
    }

    if (!stockIsValid()) {
      nextErrors.stock = "Stock must be a 6-digit number.";
    }

    if (serial === "") {
      nextErrors.serial = "Serial is required.";
    }

    if (!hasWorkSelected()) {
      nextErrors.work = "Select at least one work item.";
    }

    setFieldErrors(nextErrors);
    return Object.values(nextErrors).every((value) => value === "");
  };

  const clearDraft = () => {
    try {
      window.localStorage.removeItem(ADD_REQUEST_DRAFT_KEY);
    } catch (error) {
      console.error("Unable to clear add request draft", error);
    }
  };

  const confirmNoPartsRequired = () =>
    new Promise((resolve) => {
      noPartsDialogResolverRef.current = resolve;
      setOpenNoPartsDialog(true);
    });

  const closeNoPartsDialog = (confirmed) => {
    setOpenNoPartsDialog(false);
    if (noPartsDialogResolverRef.current) {
      noPartsDialogResolverRef.current(confirmed);
      noPartsDialogResolverRef.current = null;
    }
  };

  useEffect(() => {
    try {
      const savedDraft = window.localStorage.getItem(ADD_REQUEST_DRAFT_KEY);
      if (!savedDraft) {
        setDraftLoaded(true);
        return;
      }

      const draft = JSON.parse(savedDraft);
      setModel(draft.model || "");
      setStock(draft.stock || "");
      setSerial(draft.serial || "");
      setWork(Array.isArray(draft.work) ? draft.work : []);
      setNotes(draft.notes || "");
      if (Array.isArray(draft.partNumbersList)) {
        setPartNumbersList(
          draft.partNumbersList.length > 0 ? draft.partNumbersList : [""],
        );
      } else if (typeof draft.partNumbersInput === "string") {
        setPartNumbersList([draft.partNumbersInput]);
      } else {
        setPartNumbersList([""]);
      }
      setOther(draft.other || "");
      setChecked1(Boolean(draft.checked1));
      setChecked2(Boolean(draft.checked2));
      setChecked3(Boolean(draft.checked3));
      setChecked4(Boolean(draft.checked4));
      setChecked5(Boolean(draft.checked5));
      setChecked6(Boolean(draft.checked6));
      setChecked7(Boolean(draft.checked7));
      setChecked8(Boolean(draft.checked8));
      setChecked9(Boolean(draft.checked9));
      setEquepmentList(
        Array.isArray(draft.equipmentList) ? draft.equipmentList : [],
      );
      setOtherDisabled(
        typeof draft.otherDisabled === "boolean" ? draft.otherDisabled : true,
      );
    } catch (error) {
      console.error("Unable to restore add request draft", error);
    } finally {
      setDraftLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!draftLoaded) {
      return;
    }

    const draft = {
      model,
      stock,
      serial,
      work,
      notes,
      partNumbersList,
      other,
      checked1,
      checked2,
      checked3,
      checked4,
      checked5,
      checked6,
      checked7,
      checked8,
      checked9,
      equipmentList,
      otherDisabled,
    };

    const hasAnyDraftContent =
      equipmentList.length > 0 ||
      model !== "" ||
      stock !== "" ||
      serial !== "" ||
      notes !== "" ||
      partNumbersList.some((value) => String(value || "").trim() !== "") ||
      other !== "" ||
      work.some(Boolean);

    try {
      if (!hasAnyDraftContent) {
        window.localStorage.removeItem(ADD_REQUEST_DRAFT_KEY);
      } else {
        window.localStorage.setItem(
          ADD_REQUEST_DRAFT_KEY,
          JSON.stringify(draft),
        );
      }
    } catch (error) {
      console.error("Unable to save add request draft", error);
    }
  }, [
    draftLoaded,
    model,
    stock,
    serial,
    work,
    notes,
    partNumbersList,
    other,
    checked1,
    checked2,
    checked3,
    checked4,
    checked5,
    checked6,
    checked7,
    checked8,
    checked9,
    equipmentList,
    otherDisabled,
  ]);

  // Handle closing of the alerts.
  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpenSuccess(false);
    setOpenError(false);
  };

  // Dynamic heading for the form.
  const heading =
    equipmentList.length === 0 ? "Add Equipment" : "Equipment on Request";

  // Array of work options that populate the checkbox setion of the form.
  var workOptions = [
    {
      id: "1",
      work: "PDI",
      checkedState: checked1,
    },
    {
      id: "2",
      work: "Water in tires",
      checkedState: checked2,
    },
    {
      id: "3",
      work: "Mount to listed tractor/CCE machine",
      checkedState: checked3,
    },
    {
      id: "4",
      work: "Add loader 3rd function",
      checkedState: checked4,
    },
    {
      id: "5",
      work: "Install radio",
      checkedState: checked5,
    },
    {
      id: "6",
      work: "Mount canopy",
      checkedState: checked6,
    },
    {
      id: "7",
      work: "Widen tires",
      checkedState: checked7,
    },
    {
      id: "8",
      work: "Add rear remote",
      checkedState: checked8,
    },
  ];

  // Set the state of the "other" checkbox. It's disabled if the textfield is empty.
  const enableOther = (event) => {
    const value = event.target.value;
    setOther(value);

    // Use the current input value directly so the work list doesn't lag by one character.
    setWork((previousWork) => {
      const nextWork = [...previousWork];
      nextWork[8] = value || null;
      return nextWork;
    });

    if (value !== "") {
      setOtherDisabled(false);
      setChecked9(true);
      clearFieldError("work");
    } else if (value === "") {
      setOtherDisabled(true);
      setChecked9(false);
    }
  };

  // Handle deleting of equipment from the request.
  const handleDelete = (equipmentToDelete) => () => {
    setEquepmentList((equipmentList) =>
      equipmentList.filter((equiment) => equiment.id !== equipmentToDelete.id),
    );
  };

  // Handle changes in the checkboxes.
  const handleChange = (event) => {
    switch (event.target.id) {
      case "1":
        if (!checked1) {
          setChecked1(true);
          work[0] = event.target.value;
          setWork(work);
          clearFieldError("work");
        } else {
          setChecked1(false);
          work[0] = null;
          setWork(work);
        }
        break;
      case "2":
        if (!checked2) {
          setChecked2(true);
          work[1] = event.target.value;
          setWork(work);
          clearFieldError("work");
        } else {
          setChecked2(false);
          work[1] = null;
          setWork(work);
        }
        break;
      case "3":
        if (!checked3) {
          setChecked3(true);
          work[2] = event.target.value;
          setWork(work);
          clearFieldError("work");
        } else {
          setChecked3(false);
          work[2] = null;
          setWork(work);
        }
        break;
      case "4":
        if (!checked4) {
          setChecked4(true);
          work[3] = event.target.value;
          setWork(work);
          clearFieldError("work");
        } else {
          setChecked4(false);
          work[3] = null;
          setWork(work);
        }
        break;
      case "5":
        if (!checked5) {
          setChecked5(true);
          work[4] = event.target.value;
          setWork(work);
          clearFieldError("work");
        } else {
          setChecked5(false);
          work[4] = null;
          setWork(work);
        }
        break;
      case "6":
        if (!checked6) {
          setChecked6(true);
          work[5] = event.target.value;
          setWork(work);
          clearFieldError("work");
        } else {
          setChecked6(false);
          work[5] = null;
          setWork(work);
        }
        break;
      case "7":
        if (!checked7) {
          setChecked7(true);
          work[6] = event.target.value;
          setWork(work);
          clearFieldError("work");
        } else {
          setChecked7(false);
          work[6] = null;
          setWork(work);
        }
        break;
      case "8":
        if (!checked8) {
          setChecked8(true);
          work[7] = event.target.value;
          setWork(work);
          clearFieldError("work");
        } else {
          setChecked8(false);
          work[7] = null;
          setWork(work);
        }
        break;
      case "9":
        if (!checked9) {
          setChecked9(true);
          setWork((previousWork) => {
            const nextWork = [...previousWork];
            nextWork[8] = other || null;
            return nextWork;
          });
          clearFieldError("work");
        } else {
          setChecked9(false);
          setWork((previousWork) => {
            const nextWork = [...previousWork];
            nextWork[8] = null;
            return nextWork;
          });
        }
        break;
      default:
        break;
    }
  };

  // Add the request to the firestore "requests" collection and the equipment to the fire store "equipment" collection.
  const setRequestToFirestore = async () => {
    const timestamp = moment().format("DD-MMM-yyyy hh:mmA");
    const id = moment().format("yyyyMMDDHHmmss");
    const salesman = `${userProfile?.firstName} ${userProfile?.lastName}`;
    const changeLog = [
      createChangeLogEntry({
        user: fullName,
        actionType: CHANGE_ACTIONS.REQUEST_CREATED,
        summary: "Request created",
        timestamp,
      }),
    ];

    const firestoreRequest = {
      id: id,
      timestamp: timestamp,
      salesman: salesman,
      status: "Requested",
      statusTimestamp: timestamp,
      workOrder: "",
      changeLog: changeLog,
    };

    const requestRef = doc(
      db,
      "branches",
      userProfile.branch,
      "requests",
      firestoreRequest.id,
    );

    await setDoc(requestRef, firestoreRequest, { merge: true });

    for (var i = 0; i < equipmentList.length; i++) {
      const equipment = {
        requestID: firestoreRequest.id,
        timestamp: firestoreRequest.timestamp,
        model: equipmentList[i].model,
        stock: equipmentList[i].stock,
        serial: equipmentList[i].serial,
        work: equipmentList[i].work,
        notes: equipmentList[i].notes,
        partNumbersSummary: equipmentList[i].partNumbersSummary || "",
        changeLog: equipmentList[i].changeLog,
      };

      const equipmentRef = doc(
        db,
        "branches",
        userProfile.branch,
        "requests",
        firestoreRequest.id,
        "equipment",
        equipment.stock,
      );
      await setDoc(equipmentRef, equipment, { merge: true });

      const partNumbers = Array.isArray(equipmentList[i].partNumbers)
        ? equipmentList[i].partNumbers
        : [];
      for (const partNumber of partNumbers) {
        const partNumberRef = doc(
          db,
          "branches",
          userProfile.branch,
          "requests",
          firestoreRequest.id,
          "equipment",
          equipment.stock,
          "partNumbers",
          toPartNumberDocId(partNumber),
        );
        await setDoc(
          partNumberRef,
          {
            partNumber,
            timestamp: firestoreRequest.timestamp,
            requestID: firestoreRequest.id,
            equipmentStock: equipment.stock,
          },
          { merge: true },
        );
      }
    }

    sendNewRequestEmail(
      timestamp,
      equipmentList,
      fullName,
      userProfile,
      salesman,
    );
    resetForm();
    setEquepmentList([]);
    clearDraft();
  };

  // Reset the form
  const resetForm = async () => {
    setModel("");
    setStock("");
    setSerial("");
    setNotes("");
    setPartNumbersList([""]);
    setOther("");
    setOtherDisabled(true);
    setChecked1(false);
    setChecked2(false);
    setChecked3(false);
    setChecked4(false);
    setChecked5(false);
    setChecked6(false);
    setChecked7(false);
    setChecked8(false);
    setChecked9(false);
    setWork([]);
    setFieldErrors({
      model: "",
      stock: "",
      serial: "",
      work: "",
    });
    console.log("form reset");
  };

  // Push equipment to a state array to later be set to firestore "equipment" collection with the "requests" collection.
  const pushEquipmentToRequest = async () => {
    var temp = [];

    for (let i of work) i && temp.push(i); // copy each non-empty value to the 'temp' array

    var workString = temp.toString().replace(/,/g, ", ");

    if (workString[0] === ",") {
      workString = workString.substring(1).trim();
    }

    console.log(workString);

    const changeLog = [
      createChangeLogEntry({
        user: fullName,
        actionType: CHANGE_ACTIONS.EQUIPMENT_ADDED,
        summary: "Equipment added to request",
      }),
    ];

    const parsedPartNumbers = normalizePartNumbers(partNumbersList);
    if (parsedPartNumbers.length === 0) {
      const confirmedNoParts = await confirmNoPartsRequired();
      if (!confirmedNoParts) {
        return false;
      }
    }

    var equipment = {
      id: equipmentList.length + 1,
      model: model,
      stock: stock,
      serial: serial,
      work: workString,
      notes: notes,
      partNumbers: parsedPartNumbers,
      partNumbersSummary: toPartNumberSummary(parsedPartNumbers),
      changeLog: changeLog,
    };

    equipmentList.push(equipment);
    setEquepmentList(equipmentList);
    console.log("Temp EQ");
    console.log(equipmentList);

    await resetForm();
    return true;
  };

  const handlePartNumberRowChange = (index, value) => {
    setPartNumbersList((previous) => {
      const next = [...previous];
      next[index] = value.toUpperCase();
      return next;
    });
  };

  const handleAddPartNumberRow = () => {
    setPartNumbersList((previous) => [...previous, ""]);
  };

  const handleRemovePartNumberRow = (index) => {
    setPartNumbersList((previous) => {
      if (previous.length <= 1) {
        return [""];
      }
      return previous.filter((_, rowIndex) => rowIndex !== index);
    });
  };

  // Squipment submission validation.
  const equipmentSubmitValidation = async (event) => {
    event.preventDefault();
    if (!validateCurrentEquipment()) {
      setValidationMessage("Please fix the highlighted fields.");
      setOpenError(true);
      return;
    }

    const equipmentAdded = await pushEquipmentToRequest();
    if (!equipmentAdded) {
      return;
    }
    const lastIndex = equipmentList[equipmentList.length - 1]?.model;
    setValidationMessage(lastIndex + " successfully added to the request");
    setOpenSuccess(true);
  };

  // Requst submission validation.
  const requestSubmitValidation = async (event) => {
    event.preventDefault();
    if (equipmentList.length === 0 && !validateCurrentEquipment()) {
      setValidationMessage("Please fix the highlighted fields.");
      setOpenError(true);
      return false;
    } else {
      console.log("eq added directly from submit");
      if (
        model !== "" &&
        stockIsValid() &&
        serial !== "" &&
        hasWorkSelected()
      ) {
        console.log("another eq added first");
        const equipmentAdded = await pushEquipmentToRequest();
        if (!equipmentAdded) {
          return false;
        }
      }
      await setRequestToFirestore();
      setValidationMessage("Request successfully submitted");
      setOpenSuccess(true);
    }
  };

  // Shortcut handlers intentionally attach once for this mounted form instance.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onShortcutSave = () => {
      requestSubmitValidation({ preventDefault: () => {} });
    };

    const onShortcutClose = () => {
      if (onClose) {
        onClose();
      }
    };

    window.addEventListener("request-shortcut-save", onShortcutSave);
    window.addEventListener("request-shortcut-close", onShortcutClose);

    return () => {
      window.removeEventListener("request-shortcut-save", onShortcutSave);
      window.removeEventListener("request-shortcut-close", onShortcutClose);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  // UI view of the submission form
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: 560,
        maxHeight: "80vh",
        overflowY: "auto",
        p: 2,
      }}
    >
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 2,
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          pt: 1,
          pb: 1,
          mb: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography color="primary" variant="h6" sx={{ fontWeight: "bold" }}>
          Submit PDI/Setup Request
        </Typography>
        {onClose ? (
          <Button size="small" onClick={onClose} startIcon={<CloseRounded />}>
            Close
          </Button>
        ) : null}
      </Box>

      <form style={{ width: "100%", marginTop: "4px" }} noValidate>
        <Stack mb={1}>
          <Typography component="h1" fontWeight="bold" variant="subtitle1">
            {heading}
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-start",
              alignContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
              listStyle: "none",
              p: 0.5,
              m: 0,
            }}
            component="ul"
          >
            {equipmentList.map((data) => {
              let icon = <Agriculture />;

              return (
                <ListItem key={data.id}>
                  <Chip
                    icon={icon}
                    label={data.model}
                    variant="outlined"
                    color="primary"
                    // size="small"
                    onDelete={handleDelete(data)}
                  />
                </ListItem>
              );
            })}
          </Box>
        </Stack>
        <Grid container spacing={1.25}>
          <Grid item xs={12} sm={6}>
            <TextField
              variant="outlined"
              required
              fullWidth
              size="small"
              id="model"
              label="Model"
              autoFocus
              onChange={(e) => {
                setModel(e.target.value.toUpperCase());
                clearFieldError("model");
              }}
              value={model}
              error={Boolean(fieldErrors.model)}
              helperText={fieldErrors.model}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              variant="outlined"
              required
              fullWidth
              size="small"
              inputProps={{ style: { fontSize: 14 } }}
              id="stock"
              label="Stock"
              name="stock"
              onChange={(e) => {
                setStock(e.target.value);
                clearFieldError("stock");
              }}
              value={stock}
              error={Boolean(fieldErrors.stock)}
              helperText={fieldErrors.stock}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              variant="outlined"
              fullWidth
              size="small"
              inputProps={{ style: { fontSize: 14 } }}
              required
              id="serial"
              label="Serial"
              onChange={(e) => {
                setSerial(e.target.value.toUpperCase());
                clearFieldError("serial");
              }}
              value={serial}
              error={Boolean(fieldErrors.serial)}
              helperText={fieldErrors.serial}
            ></TextField>
          </Grid>

          <Grid item xs={12}>
            <div className="checkBoxes">
              <FormGroup>
                <Typography variant="subtitle1" style={{ fontSize: 16 }}>
                  Work Required*
                </Typography>

                {workOptions.map((option, index) => (
                  <FormControlLabel
                    key={index}
                    control={
                      <Checkbox
                        id={option.id}
                        checked={option.checkedState}
                        size="small"
                        onChange={handleChange}
                        color="primary"
                        value={option.work}
                      />
                    }
                    label={
                      <Typography style={{ fontSize: 14 }}>
                        {option.work}
                      </Typography>
                    }
                  />
                ))}
                <Stack direction="row">
                  <FormControlLabel
                    control={
                      <Checkbox
                        id="9"
                        checked={checked9}
                        size="small"
                        onChange={handleChange}
                        disabled={otherDisabled}
                        color="primary"
                        value={other}
                      />
                    }
                    label={
                      <Typography style={{ fontSize: 14 }}>Other: </Typography>
                    }
                  />

                  <TextField
                    fullWidth
                    size="small"
                    inputProps={{ style: { fontSize: 14 } }}
                    id="other"
                    value={other}
                    onChange={enableOther}
                  />
                </Stack>
                {fieldErrors.work ? (
                  <Typography color="error" variant="caption" sx={{ mt: 0.5 }}>
                    {fieldErrors.work}
                  </Typography>
                ) : null}
              </FormGroup>
            </div>
          </Grid>

          <Grid item xs={12}>
            <Stack spacing={1}>
              <Typography variant="subtitle1" fontWeight="bold">
                Part Numbers
              </Typography>
              {partNumbersList.map((partNumber, index) => (
                <Stack
                  key={`part-number-row-${index}`}
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                >
                  <TextField
                    variant="outlined"
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
                    disabled={partNumbersList.length === 1 && !partNumber}
                  >
                    Remove
                  </Button>
                </Stack>
              ))}
              <Box>
                <Button
                  size="small"
                  variant="text"
                  onClick={handleAddPartNumberRow}
                >
                  Add Part Number
                </Button>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <TextField
              variant="outlined"
              fullWidth
              size="small"
              inputProps={{ style: { fontSize: 14 } }}
              id="notes"
              label="Addtional Notes"
              name="notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={8}>
            <Button
              fullWidth
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<AddCircleOutline />}
              onClick={equipmentSubmitValidation}
            >
              Add Equipment
            </Button>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              size="small"
              variant="contained"
              color="primary"
              endIcon={<SendRounded color="secondary" />}
              onClick={requestSubmitValidation}
            >
              <Typography color="secondary">Submit</Typography>
            </Button>
          </Grid>
        </Grid>

        <Snackbar
          open={openSuccess}
          autoHideDuration={3000}
          onClose={handleClose}
        >
          <Alert
            onClose={handleClose}
            severity="success"
            sx={{ width: "100%" }}
          >
            {validationMessage}
          </Alert>
        </Snackbar>

        <Snackbar
          open={openError}
          autoHideDuration={3000}
          onClose={handleClose}
        >
          <Alert onClose={handleClose} severity="error" sx={{ width: "100%" }}>
            {validationMessage}
          </Alert>
        </Snackbar>

        <Dialog
          open={openNoPartsDialog}
          onClose={() => closeNoPartsDialog(false)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>Confirm No Parts Required</DialogTitle>
          <DialogContent>
            <Typography variant="body2">
              This equipment has no part numbers attached. Please confirm that
              no parts are required for this equipment or add the required parts
              now.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => closeNoPartsDialog(false)}>Add Parts</Button>
            <Button
              variant="contained"
              onClick={() => closeNoPartsDialog(true)}
            >
              No Parts Required
            </Button>
          </DialogActions>
        </Dialog>
      </form>
    </Box>
  );
}
