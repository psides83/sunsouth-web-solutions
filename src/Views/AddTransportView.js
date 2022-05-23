//Imports
import React, { useState } from "react";
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
import { Agriculture, AgricultureRounded, LocalShippingRounded } from "@mui/icons-material";
import { states } from "../models/states";

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

export default function AddTransportView() {
  //#region State Properties
  const classes = useStyles();
  const [{ userProfile }] = useStateValue();
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openError, setOpenError] = useState(false);
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
  var [model, setModel] = useState("");
  var [stock, setStock] = useState("");
  var [serial, setSerial] = useState("");
  var [notes, setNotes] = useState("");
  var [equipmentList, setEquipmentList] = useState([]);
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

  // Dynamic heading for the form.
  const heading =
    equipmentList.length === 0 ? "Add Equipment" : "Equipment on Request";

  // Handle deleting of equipment from the request.
  const handleDelete = (equipmentToDelete) => () => {
    setEquipmentList((equipmentList) =>
      equipmentList.filter((equiment) => equiment.id !== equipmentToDelete.id)
    );
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
    const id = moment().format("yyyyMMDDHHmmss");
    const salesman = `${userProfile?.firstName} ${userProfile?.lastName}`;
    const changeLog = [
      {
        user: fullName,
        change: `request created`,
        timestamp: timestamp,
      },
    ];

    const firestoreTransportRequest = {
      id: id,
      timestamp: timestamp,
      salesman: salesman,
      status: "Requested",
      statusTimestamp: timestamp,
      workOrder: "",
      requestDate: requestedDate,
      customerName: customerName,
      customerPhone: customerPhone,
      customerStreet: customerStreet,
      customerCity: customerCity,
      customerState: customerState,
      customerZip: customerZip,
      requestType: requestType,
      hasTrade: hasTrade,
      requestNotes: requestNotes,
      equipment: equipmentList,
      changeLog: changeLog,
    };

    const requestRef = doc(
      db,
      "branches",
      userProfile.branch,
      "transport",
      firestoreTransportRequest.id
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

    resetEquipmentForm();
    setEquipmentList([]);
  };

  // TODO add request rest

  // TODO add complete form reset

  // Reset the form
  const resetEquipmentForm = async () => {
    setModel("");
    setStock("");
    setSerial("");
    setNotes("");
    console.log("form reset");
  };

  // Push equipment to a state array to later be set to firestore "equipment" collection with the "requests" collection.
  const pushEquipmentToRequest = async () => {
    const id = moment().format("yyyyMMDDHHmmss");
    const changeLog = [
      {
        user: fullName,
        change: `equipment added to request`,
        timestamp: moment().format("DD-MMM-yyyy hh:mmA"),
      },
    ];

    var equipment = {
      id: id,
      model: model,
      stock: stock,
      serial: serial,
      notes: notes,
      changeLog: changeLog,
    };

    equipmentList.push(equipment);
    setEquipmentList(equipmentList);
    console.log(equipmentList);

    await resetEquipmentForm();
  };

  // Squipment submission validation.
  const equipmentSubmitValidation = async (event) => {
    event.preventDefault();

    const lowerCaseLetters = /[a-z]/g;
    const upperCaseLetters = /[A-Z]/g;

    if (model === "") {
      setValidationMessage(
        "Equipment must have a model to be added to a request"
      );
      setOpenError(true);
      return;
    } else if (
      stock.length !== 6 ||
      stock.match(lowerCaseLetters) ||
      stock.match(upperCaseLetters)
    ) {
      setValidationMessage(
        "Equipment must have a 6 digit stock number to be added to a request"
      );
      setOpenError(true);
      return;
    } else if (serial === "") {
      setValidationMessage(
        "Equipment must have a serial number to be added to a request"
      );
      setOpenError(true);
      return;
    } else {
      pushEquipmentToRequest();
      const lastIndex = equipmentList[equipmentList.length - 1]?.model;
      setValidationMessage(lastIndex + " successfully added to the request");
      setOpenSuccess(true);
    }
  };

  // Requst submission validation.
  const requestSubmitValidation = async (event) => {
    event.preventDefault();

    const lowerCaseLetters = /[a-z]/g;
    const upperCaseLetters = /[A-Z]/g;

    if (model === "" && equipmentList.length === 0) {
      setValidationMessage(
        "Equipment must have a model to be added to a request"
      );
      setOpenError(true);
      return false;
    } else if (
      (stock.length !== 6 ||
        stock.match(lowerCaseLetters) ||
        stock.match(upperCaseLetters)) &&
      equipmentList.length === 0
    ) {
      setValidationMessage(
        "Equipment must have a 6 digit stock number to be added to a request"
      );
      setOpenError(true);
      return false;
    } else if (serial === "" && equipmentList.length === 0) {
      setValidationMessage(
        "Equipment must have a serial number to be added to a request"
      );
      setOpenError(true);
      return false;
    } else {
      console.log("eq added directly from submit");
      if (
        model !== "" &&
        (stock.length === 6 ||
          stock.match(lowerCaseLetters) === false ||
          stock.match(upperCaseLetters) === false) &&
        serial !== ""
      ) {
        console.log("another eq added first");
        await pushEquipmentToRequest();
      }
      await setRequestToFirestore();
      setValidationMessage("Request successfully submitted");
      setOpenSuccess(true);
    }
  };

  // Handle lead name input and capitolize each word
  const handleNameInput = (e) => {
    const names = e.target.value;

    const finalName = names.replace(/(^\w{1})|(\s+\w{1})/g, (letter) =>
      letter.toUpperCase()
    );

    setCustomerName(finalName);
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
            <Grid item xs={12} sm={6}>
              <TextField
                key="date"
                name="date"
                variant="outlined"
                type="date"
                required
                fullWidth
                size="small"
                id="date"
                autoFocus
                onChange={(e) => setRequestedDate(e.target.value)}
                value={requestedDate}
                InputLabelProps={{
                  shrink: true,
                }}
                label="Date"
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
                onChange={(e) => setCustomerPhone(e.target.value)}
                value={customerPhone}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
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
          <Stack mb={1}>
            <Typography component="h1" variant="h6">
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
                let icon = <AgricultureRounded />;

                return (
                  <ListItem key={data.id}>
                    <Chip
                      icon={icon}
                      label={data.model}
                      variant="outlined"
                      color="success"
                      // size="small"
                      onDelete={handleDelete(data)}
                    />
                  </ListItem>
                );
              })}
            </Box>
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                variant="outlined"
                required
                fullWidth
                size="small"
                inputProps={{ style: { fontSize: 14 } }}
                id="model"
                label="Model"
                autoFocus
                onChange={(e) => setModel(e.target.value.toUpperCase())}
                value={model}
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
                onChange={(e) => setStock(e.target.value)}
                value={stock}
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
                onChange={(e) => setSerial(e.target.value.toUpperCase())}
                value={serial}
              ></TextField>
            </Grid>
            {/* <Grid item xs={12}>
              <div className="checkBoxes">
                <FormGroup>
                  <Typography variant="h6" style={{ fontSize: 18 }}>
                    Work Required*
                  </Typography>
                  {workOptions.map((option) => (
                    <FormControlLabel
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
                          id="8"
                          checked={checked8}
                          size="small"
                          onChange={handleChange}
                          disabled={otherDisabled}
                          color="primary"
                          value={other}
                        />
                      }
                      label={
                        <Typography style={{ fontSize: 14 }}>
                          Other:{" "}
                        </Typography>
                      }
                    />

                    <TextField
                      fullWidth
                      size="small"
                      inputProps={{ style: { fontSize: 14 } }}
                      id="other"
                      value={other}
                      onChange={enableOther}
                    ></TextField>
                  </Stack>
                </FormGroup>
              </div>
            </Grid> */}
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
              color="primary"
              startIcon={<AddCircleOutlineIcon />}
              className={classes.addEquipment}
              onClick={equipmentSubmitValidation}
            >
              Add More Equipment
            </Button>
            <Button
              variant="contained"
              color="primary"
              endIcon={<SendRoundedIcon className={classes.submitIcon} />}
              className={classes.submit}
              onClick={requestSubmitValidation}
            >
              <p className={classes.submitIcon}>Submit</p>
            </Button>
          </Grid>
        </form>
      </Box>
      {/* <Box mt={5}>
        <Copyright />
      </Box> */}
    </Container>
  );
}
