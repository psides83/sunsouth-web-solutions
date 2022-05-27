//Imports
import React, { useCallback, useState, useEffect } from "react";
import { db } from "../services/firebase";
import "../styles/SignUp.css";
import { setDoc, doc, deleteDoc } from "@firebase/firestore";
import "../styles/AddRequest.css";
import { useStateValue } from "../state-management/StateProvider";
import moment from "moment";
import { sendNewRequestEmail, sendTransportDeletedEmail } from "../services/email-service";
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
  const {
    transportRequest,
    handleCloseEditTansportView,
    openAddTransportView,
    handleToggleEditTansportView,
  } = props;
  const [{ userProfile }] = useStateValue();
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openError, setOpenError] = useState(false);
  var [workOrder, setWorkOrder] = useState("");
  var [customerName, setCustomerName] = useState("");
  var [customerPhone, setCustomerPhone] = useState("");
  var [customerStreet, setCustomerStreet] = useState("");
  var [customerCity, setCustomerCity] = useState("");
  var [customerState, setCustomerState] = useState("AL");
  var [customerZip, setCustomerZip] = useState("");
  var [requestedDate, setRequestedDate] = useState("");
  var [requestType, setRequestType] = useState("");
  var [requestNotes, setRequestNotes] = useState("");
  var [hasTrade, setHasTrade] = useState(false);
  var [startDate, setStartDate] = useState("");
  var [endDate, setEndDate] = useState("");
  var [status, setStatus] = useState("");
  var [validationMessage, setValidationMessage] = useState("");
  const fullName = userProfile?.firstName + " " + userProfile?.lastName;
  const [isShowingConfirmDialog, setIsShowingConfirmDialog] = useState(false);
  //#endregion

  // Handle closing of the alerts.
  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpenSuccess(false);
    setOpenError(false);
  };

  const handleCloseConfirmDialog = () => {
    setIsShowingConfirmDialog(false);
  };

  const handleToggleConfirmDialog = () => {
    setIsShowingConfirmDialog(!isShowingConfirmDialog);
  };

  const loadTransport = useCallback(() => {
    setWorkOrder(transportRequest.workOrder);
    setCustomerName(transportRequest.customerName);
    setCustomerPhone(transportRequest.customerPhone);
    setCustomerStreet(transportRequest.customerStreet);
    setCustomerCity(transportRequest.customerCity);
    setCustomerState(transportRequest.customerState);
    setCustomerZip(transportRequest.customerZip);
    setRequestType(transportRequest.requestType);
    setRequestNotes(transportRequest.requestNotes);
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
  }, [transportRequest]);

  useEffect(() => {
    loadTransport();
  }, [loadTransport]);

  // Handle deleting of equipment from the request.
  const deleteTransportRequest = async () => {
    await deleteDoc(doc(
      db,
      "branches",
      userProfile.branch,
      "transport",
      transportRequest.id
    ));

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
  };

  // Add the request to the firestore "requests" collection and the equipment to the fire store "equipment" collection.
  const setRequestToFirestore = async () => {
    const timestamp = moment().format("DD-MMM-yyyy hh:mmA");
    // const id = moment().format("yyyyMMDDHHmmss");
    const salesman = `${userProfile?.firstName} ${userProfile?.lastName}`;
    const changeLog = [
      {
        user: fullName,
        change: `request edited`,
        timestamp: timestamp,
      },
    ];

    const firestoreTransportRequest = {
      status: status,
      statusTimestamp: timestamp,
      startDate: startDate,
      endDate: endDate,
      customerName: customerName,
      customerPhone: customerPhone,
      customerStreet: customerStreet,
      customerCity: customerCity,
      customerState: customerState,
      customerZip: customerZip,
      requestType: requestType,
      hasTrade: hasTrade,
      requestNotes: requestNotes,
      changeLog: changeLog,
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

  // TODO add request reset

  // TODO add complete form reset

  // Handle lead name input and capitolize each word
  const handleNameInput = (e) => {
    const names = e.target.value;

    const finalName = names.replace(/(^\w{1})|(\s+\w{1})/g, (letter) =>
      letter.toUpperCase()
    );

    setCustomerName(finalName);
  };

  const handleEndDateInput = (e) => {
    if (e.target.value < startDate) return setEndDate("");
    return setEndDate(e.target.value);
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

      <Dialog onClose={handleCloseEditTansportView} open={openAddTransportView}>
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
                    {`${requestType} Date Requested: ${moment(
                      requestedDate
                    ).format("DD-MMM-yyyy")}`}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    key="startDate"
                    name="startDate"
                    variant="outlined"
                    type="datetime-local"
                    fullWidth
                    size="small"
                    id="startDate"
                    onChange={(e) => setStartDate(e.target.value)}
                    value={startDate}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    label="Start Date"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
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
                    inputProps={{ style: { fontSize: 14 } }}
                    id="customerName"
                    label="Customer Name"
                    autoFocus
                    onChange={handleNameInput}
                    value={customerName}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    size="small"
                    InputProps={{
                      inputComponent: PhoneNumberMask,
                      style: { fontSize: 14 },
                    }}
                    id="phone"
                    label="Phone Number"
                    name="phone"
                    // InputProps={{
                    //     inputComponent: PhoneNumberMask,
                    //   }}
                    onChange={(e) =>
                      setCustomerPhone(
                        e.target.value.replace(/[^0-9\-()" "]/g, "")
                      )
                    }
                    value={customerPhone}
                  />
                </Grid>

                <Grid item xs={12} sm={12}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    size="small"
                    inputProps={{ style: { fontSize: 14 } }}
                    id="street"
                    label="Street"
                    name="street"
                    onChange={(e) => setCustomerStreet(e.target.value)}
                    value={customerStreet}
                  />
                </Grid>

                <Grid item xs={12} sm={5}>
                  <TextField
                    variant="outlined"
                    required
                    fullWidth
                    size="small"
                    inputProps={{ style: { fontSize: 14 } }}
                    id="city"
                    label="City"
                    name="city"
                    onChange={(e) => setCustomerCity(e.target.value)}
                    value={customerCity}
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
                    value={customerState}
                    label="State"
                    onChange={(e) => setCustomerState(e.target.value)}
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
                    inputProps={{ style: { fontSize: 14 } }}
                    id="zip"
                    label="Zip"
                    name="zip"
                    onChange={(e) => setCustomerZip(e.target.value)}
                    value={customerZip}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    size="small"
                    inputProps={{ style: { fontSize: 14 } }}
                    id="status"
                    label="Status Status"
                    name="status"
                    onChange={(e) => setStatus(e.target.value)}
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
                    inputProps={{ style: { fontSize: 14 } }}
                    id="type"
                    label="Request Type"
                    name="type"
                    onChange={(e) => setRequestType(e.target.value)}
                    value={requestType}
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
                    inputProps={{ style: { fontSize: 14 } }}
                    id="workOrder"
                    label="Work Order"
                    name="workOrder"
                    onChange={(e) => setWorkOrder(e.target.value)}
                    value={workOrder}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    multiline
                    size="small"
                    inputProps={{ style: { fontSize: 14 } }}
                    id="notes"
                    label="Addtional Notes"
                    name="notes"
                    type="text"
                    value={requestNotes}
                    onChange={(e) => setRequestNotes(e.target.value)}
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
                    endIcon={<SendRounded color="secondary" />}
                    onClick={setRequestToFirestore}
                  >
                    <Typography color="secondary">Submit</Typography>
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
              <Button variant="contained" color="error" onClick={deleteTransportRequest}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
