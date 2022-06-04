//Imports
import React, { useCallback, useState, useEffect } from "react";
import { db } from "../services/firebase";
import "../styles/SignUp.css";
import { setDoc, doc, deleteDoc } from "@firebase/firestore";
import "../styles/AddRequest.css";
import { useStateValue } from "../state-management/StateProvider";
import moment from "moment";
import {
  sendNewRequestEmail,
  sendTransportDeletedEmail,
} from "../services/email-service";
import { states } from "../models/states";
import { PhoneNumberMask } from "../components/phone-number-mask";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  MenuItem,
  Snackbar,
  styled,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  CancelOutlined,
  DeleteRounded,
  EditRounded,
  LocalShippingRounded,
  SendRounded,
} from "@mui/icons-material";

const ListItem = styled("li")(({ theme }) => ({
  margin: theme.spacing(0.5),
}));

export default function EditTransportView(props) {
  //#region State Properties
  const { transportRequest } = props;
  const [{ userProfile }] = useStateValue();
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openError, setOpenError] = useState(false);
  var [workOrder, setWorkOrder] = useState("");
  var [name, setName] = useState("");
  var [phone, setPhone] = useState("");
  var [street, setStreet] = useState("");
  var [city, setCity] = useState("");
  var [state, setState] = useState("AL");
  var [zip, setZip] = useState("");
  var [requestedDate, setRequestedDate] = useState("");
  var [type, setType] = useState("");
  var [notes, setNotes] = useState("");
  var [hasTrade, setHasTrade] = useState(false);
  var [startDate, setStartDate] = useState("");
  var [endDate, setEndDate] = useState("");
  var [status, setStatus] = useState("");
  var [change, setChange] = useState([]);
  const [importedData, setImportedData] = useState({});
  const [dataHasChanges, setDataHasChanges] = useState(false);
  var [validationMessage, setValidationMessage] = useState("");
  const fullName = userProfile?.firstName + " " + userProfile?.lastName;
  const [isShowingConfirmDialog, setIsShowingConfirmDialog] = useState(false);
  const [openEditTransportView, setOpenEditTransportView] = useState(false);
  // TODO setup loading and success and add progress circle on submit button
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  //#endregion

  // Handle closing of the alerts.
  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpenSuccess(false);
    setOpenError(false);
  };

  const handleCloseEditTansportView = () => {
    setOpenEditTransportView(false);
    resetForm();
  };

  const handleToggleEditTansportView = () => {
    setDataHasChanges(false);
    setOpenEditTransportView(!openEditTransportView);
  };

  const handleCloseConfirmDialog = () => {
    setIsShowingConfirmDialog(false);
  };

  const handleToggleConfirmDialog = () => {
    setIsShowingConfirmDialog(!isShowingConfirmDialog);
  };

  const loadTransport = useCallback(() => {
    if (openEditTransportView) {
      setWorkOrder(transportRequest.workOrder);
      setName(transportRequest.name);
      setPhone(transportRequest.phone);
      setStreet(transportRequest.street);
      setCity(transportRequest.city);
      setState(transportRequest.state);
      setZip(transportRequest.zip);
      setType(transportRequest.type);
      setNotes(transportRequest.notes);
      setRequestedDate(transportRequest.requestedDate);
      if (
        transportRequest.startDate != undefined ||
        transportRequest.startDate != null ||
        transportRequest.startDate != ""
      ) {
        setStartDate(transportRequest.startDate);
      }
      if (
        transportRequest.endDate != undefined ||
        transportRequest.endDate != null ||
        transportRequest.endDate != ""
      ) {
        setEndDate(transportRequest.endDate);
      }
      setHasTrade(transportRequest.hasTrade);
      setStatus(transportRequest.status);

      setImportedData({
        workOrder: transportRequest.workOrder,
        name: transportRequest.name,
        phone: transportRequest.phone,
        street: transportRequest.street,
        city: transportRequest.city,
        state: transportRequest.state,
        zip: transportRequest.zip,
        type: transportRequest.type,
        status: transportRequest.status,
        notes: transportRequest.notes,
        startDate: transportRequest.startDate,
        endDate: transportRequest.endDate,
        hasTrade: transportRequest.hasTrade,
      });
    }
  }, [openEditTransportView]);

  useEffect(() => {
    loadTransport();
  }, [loadTransport]);

  // Handle deleting of equipment from the request.
  const deleteTransportRequest = async () => {
    await deleteDoc(
      doc(db, "branches", userProfile.branch, "transport", transportRequest.id)
    );

    sendTransportDeletedEmail(transportRequest, fullName, userProfile);
    handleCloseConfirmDialog();
    handleCloseEditTansportView();
  };

  const handleHasTrade = () => {
    if (hasTrade) {
      setHasTrade(false);
    } else {
      setHasTrade(true);
    }

    if (hasTrade !== importedData.type) {
      setDataHasChanges(true);
    } else if (hasTrade === importedData.type) {
      setDataHasChanges(false);
    }
  };

  const logChanges = async () => {
    if (name !== importedData.name) {
      console.log(importedData);
      setChange(
        change?.push(`Customer edited from ${importedData.name} to ${name}`)
      );
      console.log(change);
    }

    if (phone !== importedData.phone) {
      setChange(
        change.push(
          `Phone # for ${name} edited from ${importedData.phone} to ${phone}`
        )
      );
    }

    if (street !== importedData.street) {
      setChange(
        change.push(
          `Address Street edited from ${importedData.street} to ${street}`
        )
      );
    }

    if (city !== importedData.city) {
      setChange(
        change.push(`City edited from ${importedData.city} to ${city}`)
      );
    }

    if (state !== importedData.state) {
      setChange(
        change.push(`State edited from ${importedData.state} to ${state}`)
      );
    }

    if (zip !== importedData.zip) {
      setChange(
        change.push(`Zip Code edited from ${importedData.zip} to ${zip}`)
      );
    }

    if (workOrder !== importedData.workOrder) {
      setChange(
        change.push(
          `Work Order # for ${name} edited from ${
            importedData.workOrder === "" ? "BLANK" : importedData.workOrder
          } to ${workOrder === "" ? "BLANK" : workOrder}`
        )
      );
    }

    if (type !== importedData.type) {
      setChange(
        change.push(`Request Type edited from ${importedData.type} to ${type}`)
      );
    }

    if (status !== importedData.status) {
      setChange(
        change.push(`Status edited from ${importedData.status} to ${status}`)
      );
    }

    if (notes !== importedData.notes) {
      setChange(
        change.push(
          `Notes edited from ${
            importedData.notes === "" ? "BLANK" : importedData.notes
          } to ${notes === "" ? "BLANK" : notes}`
        )
      );
    }

    if (startDate !== importedData.startDate) {
      setChange(
        change.push(
          `Start Date edited from ${importedData.startDate} to ${startDate}`
        )
      );
    }

    if (endDate !== importedData.endDate) {
      setChange(
        change.push(
          `End Date edited from ${importedData.endDate} to ${endDate}`
        )
      );
    }
  };

  // Add the request to the firestore "requests" collection and the equipment to the fire store "equipment" collection.
  const setRequestToFirestore = async () => {
    const timestamp = moment().format("DD-MMM-yyyy hh:mmA");
    const id = moment().format("yyyyMMDDHHmmss");
    var changeString
    await logChanges().then(() => {
      changeString = change.toString().replace(/,/g, ", ");
      if (changeString[0] === ",") {
        changeString = changeString.substring(1).trim();
      }
      console.log(changeString)
    });

    const changeLogEntry = {
      id: id,
      user: fullName,
      change: changeString,
      timestamp: timestamp,
    };

    transportRequest.changeLog.push(changeLogEntry);

    const firestoreTransportRequest = {
      workOrder: workOrder,
      status: status,
      statusTimestamp: timestamp,
      startDate: startDate,
      endDate: endDate,
      name: name,
      phone: phone,
      street: street,
      city: city,
      state: state,
      zip: zip,
      type: type,
      hasTrade: hasTrade,
      notes: notes,
      changeLog: transportRequest.changeLog,
    };

    const requestRef = doc(
      db,
      "branches",
      userProfile.branch,
      "transport",
      transportRequest.id
    );

    await setDoc(requestRef, firestoreTransportRequest, { merge: true });

    //  TODO update to edit transport email
    // sendNewRequestEmail(
    //   timestamp,
    //   equipmentList,
    //   fullName,
    //   userProfile,
    //   salesman
    // );
    handleCloseEditTansportView();
  };

  const resetForm = () => {
    setWorkOrder("");
    setName("");
    setPhone("");
    setStreet("");
    setCity("");
    setState("");
    setZip("");
    setType("");
    setNotes("");
    setRequestedDate("");
    setStartDate("");
    setEndDate("");
    setHasTrade(false);
    setStatus("");
    setChange([]);
    setImportedData({});
  };

  // Handle name input and capitolize each word
  const handleNameInput = (e) => {
    const names = e.target.value;

    const finalName = names.replace(/(^\w{1})|(\s+\w{1})/g, (letter) =>
      letter.toUpperCase()
    );

    setName(finalName);
    if (finalName !== importedData.name) {
      setDataHasChanges(true);
    } else if (finalName === importedData.name) {
      setDataHasChanges(false);
    }
  };

  // Handle street input and capitolize each word
  const handleStreetInput = (e) => {
    const words = e.target.value;

    const finalStreet = words.replace(/(^\w{1})|(\s+\w{1})/g, (letter) =>
      letter.toUpperCase()
    );

    setStreet(finalStreet);
    if (finalStreet !== importedData.street) {
      setDataHasChanges(true);
    } else if (finalStreet === importedData.street) {
      setDataHasChanges(false);
    }
  };

  // Handle city input and capitolize each word
  const handleCityInput = (e) => {
    const words = e.target.value;

    const finalCity = words.replace(/(^\w{1})|(\s+\w{1})/g, (letter) =>
      letter.toUpperCase()
    );

    setCity(finalCity);
    if (finalCity !== importedData.city) {
      setDataHasChanges(true);
    } else if (finalCity === importedData.city) {
      setDataHasChanges(false);
    }
  };

  // Handle state input and capitolize each word
  const handleStateInput = (e) => {
    setState(e.target.value);

    if (e.target.value !== importedData.state) {
      setDataHasChanges(true);
    } else if (e.target.value === importedData.state) {
      setDataHasChanges(false);
    }
  };

  // Handle zip input and capitolize each word
  const handleZipInput = (e) => {
    setZip(e.target.value);

    if (e.target.value !== importedData.zip) {
      setDataHasChanges(true);
    } else if (e.target.value === importedData.zip) {
      setDataHasChanges(false);
    }
  };

  // Handle phone input and capitolize each word
  const handlePhoneInput = (e) => {
    setPhone(e.target.value);

    if (e.target.value !== importedData.phone) {
      setDataHasChanges(true);
    } else if (e.target.value === importedData.phone) {
      setDataHasChanges(false);
    }
  };

  // Handle status input and capitolize each word
  const handleStatusInput = (e) => {
    setStatus(e.target.value);

    if (e.target.value !== importedData.status) {
      setDataHasChanges(true);
    } else if (e.target.value === importedData.status) {
      setDataHasChanges(false);
    }
  };

  // Handle type input and capitolize each word
  const handleTypeInput = (e) => {
    setType(e.target.value);

    if (e.target.value !== importedData.type) {
      setDataHasChanges(true);
    } else if (e.target.value === importedData.type) {
      setDataHasChanges(false);
    }
  };

  // Handle workOrder input and capitolize each word
  const handleWorkOrderInput = (e) => {
    setWorkOrder(e.target.value);

    if (e.target.value !== importedData.workOrder) {
      setDataHasChanges(true);
    } else if (e.target.value === importedData.workOrder) {
      setDataHasChanges(false);
    }
  };

  // Handle workOrder input and capitolize each word
  const handleNotesInput = (e) => {
    setNotes(e.target.value);

    if (e.target.value !== importedData.notes) {
      setDataHasChanges(true);
    } else if (e.target.value === importedData.notes) {
      setDataHasChanges(false);
    }
  };

  const handleStartDateInput = (e) => {
    if (e.target.value < moment().format()) return setStartDate("");

    setStartDate(e.target.value);
    if (e.target.value !== importedData.startDate) {
      setDataHasChanges(true);
    } else if (e.target.value === importedData.startDate) {
      setDataHasChanges(false);
    }

    if (e.target.value > endDate) {
      setEndDate("");
    }
  };

  const handleEndDateInput = (e) => {
    if (e.target.value < startDate) return setEndDate("");

    setEndDate(e.target.value);
    if (e.target.value !== importedData.endDate) {
      setDataHasChanges(true);
    } else if (e.target.value === importedData.endDate) {
      setDataHasChanges(false);
    }
  };

  // UI view of the submission form
  return (
    <>
      <div className="editIcon">
        <IconButton onClick={handleToggleEditTansportView}>
          <div className="edit-button-bg">
            <Tooltip title="Edit Work Order">
              <EditRounded color="primary" style={{ fontSize: 16 }} />
            </Tooltip>
          </div>
        </IconButton>
      </div>

      <Dialog
        onClose={handleCloseEditTansportView}
        open={openEditTransportView}
      >
        <div className="closeButtonContainer">
          <Button onClick={handleCloseEditTansportView}>
            <CancelOutlined />
          </Button>
        </div>

        <div className="addRequestView">
          <Box
            display="flex"
            sx={{
              flexDirection: "column",
              alignItems: "center",
              maxWidth: "380px",
              padding: (theme) => theme.spacing(3),
              paddingLeft: (theme) => theme.spacing(4),
              paddingRight: (theme) => theme.spacing(4),
              paddingBottom: (theme) => theme.spacing(3),
            }}
          >
            <Avatar
              key="avatar"
              style={{
                width: 64,
                height: 64,
                margin: "10px",
                backgroundColor: "#367C2B",
              }}
            >
              <LocalShippingRounded color="secondary" fontSize="large" />
            </Avatar>

            <Typography
              key="heading"
              color="primary"
              variant="h5"
              style={{ fontWeight: "bold" }}
            >
              Transport Request
            </Typography>

            <form style={{ width: "100%", marginTop: "10px" }} noValidate>
              <Grid container spacing={2}>
                <Grid item sm={12}>
                  <Typography>
                    {`${type} Date Requested: ${moment(requestedDate).format(
                      "DD-MMM-yyyy"
                    )}`}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    key="startDate"
                    name="startDate"
                    variant="outlined"
                    type="datetime-local"
                    fullWidth
                    size="small"
                    id="startDate"
                    onChange={handleStartDateInput}
                    value={startDate}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    label="Start Date"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    key="endDate"
                    name="endDate"
                    variant="outlined"
                    type="datetime-local"
                    fullWidth
                    size="small"
                    id="endDate"
                    onChange={handleEndDateInput}
                    value={endDate}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    label="End Date"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    size="small"
                    id="name"
                    label="Customer Name"
                    autoFocus
                    onChange={handleNameInput}
                    value={name}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    size="small"
                    InputProps={{
                      maxlength: "10",
                      inputComponent: PhoneNumberMask,
                    }}
                    id="phone"
                    label="Phone Number"
                    name="phone"
                    onChange={handlePhoneInput}
                    value={phone}
                  />
                </Grid>

                <Grid item xs={12} sm={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    size="small"
                    id="street"
                    label="Street"
                    name="street"
                    onChange={handleStreetInput}
                    value={street}
                  />
                </Grid>

                <Grid item xs={12} sm={5}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    size="small"
                    id="city"
                    label="City"
                    name="city"
                    onChange={handleCityInput}
                    value={city}
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField
                    size="small"
                    variant="outlined"
                    required
                    fullWidth
                    labelId="demo-simple-select-label"
                    id="state"
                    sx={{
                      "&:before": {
                        borderColor: (theme) => theme.palette.secondary.main,
                      },
                      "&:after": {
                        borderColor: (theme) => theme.palette.secondary.main,
                      },
                      "&:not(.Mui-disabled):hover::before": {
                        borderColor: (theme) => theme.palette.secondary.main,
                      },
                    }}
                    value={state}
                    label="State"
                    onChange={handleStateInput}
                    select
                  >
                    {states.map((state) => (
                      <MenuItem value={state}>{state}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    size="small"
                    inputProps={{ maxlength: "5" }}
                    id="zip"
                    label="Zip"
                    name="zip"
                    onChange={handleZipInput}
                    value={zip}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    size="small"
                    id="status"
                    label="Status Status"
                    name="status"
                    onChange={handleStatusInput}
                    value={status}
                    select
                  >
                    <MenuItem value={"Requested"}>{"Requested"}</MenuItem>
                    <MenuItem value={"Scheduled"}>{"Scheduled"}</MenuItem>
                    <MenuItem value={"In Progress"}>{"In Progress"}</MenuItem>
                    <MenuItem value={"Completed"}>{"Completed"}</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    size="small"
                    id="type"
                    label="Request Type"
                    name="type"
                    onChange={handleTypeInput}
                    value={type}
                    select
                  >
                    <MenuItem value={"Delivery"}>{"Delivery"}</MenuItem>
                    <MenuItem value={"Pick Up"}>{"Pick Up"}</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={hasTrade}
                          size="small"
                          onChange={handleHasTrade}
                          color="primary"
                          value={hasTrade}
                        />
                      }
                      label={
                        <Typography style={{ fontSize: 14 }}>
                          Trade to return?
                        </Typography>
                      }
                    />
                  </FormGroup>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    size="small"
                    id="workOrder"
                    label="Work Order"
                    name="workOrder"
                    inputProps={{ maxlength: "6" }}
                    onChange={handleWorkOrderInput}
                    value={workOrder}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    multiline
                    size="small"
                    id="notes"
                    label="Addtional Notes"
                    name="notes"
                    type="text"
                    value={notes}
                    onChange={handleNotesInput}
                  />
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
                  <Alert
                    onClose={handleClose}
                    severity="error"
                    sx={{ width: "100%" }}
                  >
                    {validationMessage}
                  </Alert>
                </Snackbar>

                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteRounded />}
                    onClick={handleToggleConfirmDialog}
                  >
                    Delete
                  </Button>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    endIcon={
                      <SendRounded color={!dataHasChanges ? "" : "secondary"} />
                    }
                    disabled={!dataHasChanges || loading}
                    onClick={setRequestToFirestore}
                  >
                    <Typography color={!dataHasChanges ? "" : "secondary"}>
                      Submit
                    </Typography>
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Box>
        </div>
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
            <Typography>Are you sure you want to</Typography>
            <Typography>delete this Transport Request?</Typography>
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
                color="info"
                onClick={handleCloseConfirmDialog}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={deleteTransportRequest}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
