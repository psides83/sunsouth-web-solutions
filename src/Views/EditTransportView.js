//Imports
import React, { useCallback, useState, useEffect } from "react";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import { db } from "../services/firebase";
import "../styles/SignUp.css";
import { setDoc, doc } from "@firebase/firestore";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { Avatar, FormGroup } from "@material-ui/core";
import { Alert, MenuItem, Stack } from "@mui/material";
import "../styles/AddRequest.css";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useStateValue } from "../state-management/StateProvider";
import moment from "moment";
import { styled } from "@mui/material/styles";
import Chip from "@mui/material/Chip";
import Snackbar from "@material-ui/core/Snackbar";
import { sendNewRequestEmail } from "../services/email-service";
import {
  Agriculture,
  AgricultureRounded,
  LocalShippingRounded,
} from "@mui/icons-material";
import { states } from "../models/states";
import { PhoneNumberMask } from "../components/phone-number-mask";


// Sets useStyles for customizing Material UI components.
const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(4),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    margin: theme.spacing(1),
    backgroundColor: theme.palette.primary.main,
  },
  img: {
    padding: 1,
  },
  icon: {
    color: theme.palette.secondary.main,
  },
  title: {
    color: theme.palette.primary.main,
  },
  form: {
    width: "100%", // Fix IE 11 issue.
    marginTop: theme.spacing(3),
  },
  addEquipment: {
    margin: theme.spacing(3, 0, 2),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  submitIcon: {
    color: theme.palette.secondary.main,
  },
  select: {
    "&:before": {
      borderColor: theme.palette.secondary.main,
    },
    "&:after": {
      borderColor: theme.palette.secondary.main,
    },
    "&:not(.Mui-disabled):hover::before": {
      borderColor: theme.palette.secondary.main,
    },
  },
}));

const ListItem = styled("li")(({ theme }) => ({
  margin: theme.spacing(0.5),
}));

export default function EditTransportView(props) {
  //#region State Properties
  const { transportRequest, handleCloseEditTansportView } = props;
  const classes = useStyles();
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
  //#endregion

  // Handle closing of the alerts.
  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpenSuccess(false);
    setOpenError(false);
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

  // TODO update to delete request
  // Handle deleting of equipment from the request.
  //   const handleDelete = (equipmentToDelete) => () => {
  //     setEquipmentList((equipmentList) =>
  //       equipmentList.filter((equiment) => equiment.id !== equipmentToDelete.id)
  //     );
  //   };

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

    //  TODO update to new transport email
    // sendNewRequestEmail(
    //   timestamp,
    //   equipmentList,
    //   fullName,
    //   userProfile,
    //   salesman
    // );
    handleCloseEditTansportView();
  };

  // TODO add request rest

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
    <Container component="main" maxWidth="xs" sx={{ margin: 20 }}>
      <CssBaseline />
      <Box className={classes.paper}>
        <Avatar className={classes.avatar}>
          <LocalShippingRounded className={classes.icon} fontSize="large" />
        </Avatar>
        <Typography component="h1" variant="h" className={classes.title}>
          Transport Request
        </Typography>
        <form className={classes.form} noValidate>
          <Grid container spacing={2}>
            <Grid item sm={12}>
              <Typography>
                {`Date Requested: ${moment(requestedDate).format(
                  "DD-MMM-yyyy"
                )}`}
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
                inputProps={{ style: { fontSize: 14 } }}
                id="phone"
                label="Phone Number"
                name="phone"
                // InputProps={{
                //     inputComponent: PhoneNumberMask,
                //   }}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/[^0-9\-()" "]/g, ""))}
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
                className={classes.select}
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
                <MenuItem value={"Pick Up"}>{"Pick Up"}</MenuItem>
                <MenuItem value={"Delivery"}>{"Delivery"}</MenuItem>
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

          <Grid container justifyContent="space-between">
            <Button
              variant="outlined"
              color="error"
              className={classes.addEquipment}
              onClick={handleCloseEditTansportView}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              endIcon={<SendRoundedIcon className={classes.submitIcon} />}
              className={classes.submit}
              onClick={setRequestToFirestore}
            >
              <p className={classes.submitIcon}>Submit</p>
            </Button>
          </Grid>
        </form>
      </Box>
    </Container>
  );
}
