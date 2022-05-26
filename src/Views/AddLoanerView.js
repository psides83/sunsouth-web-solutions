//Imports
import React, { useState } from "react";
import { db } from "../services/firebase";
import "../styles/SignUp.css";
import { setDoc, doc } from "@firebase/firestore";
import "../styles/AddRequest.css";
import { useStateValue } from "../state-management/StateProvider";
import moment from "moment";
import { sendNewLoanerEmail } from "../services/email-service";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Grid,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { AgricultureRounded, SendRounded } from "@mui/icons-material";

export default function AddLoanerView() {
  //#region State Properties
  const [{ userProfile }] = useStateValue();
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openError, setOpenError] = useState(false);
  var [model, setModel] = useState("");
  var [stock, setStock] = useState("");
  var [serial, setSerial] = useState("");
  var [hours, setHours] = useState("");
  var [dateOut, setDateOut] = useState("");
  var [customer, setCustomer] = useState("");
  var [validationMessage, setValidationMessage] = useState("");
  const employee = userProfile?.firstName + " " + userProfile?.lastName;
  //#endregion

  // Handle closing of the alerts.
  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpenSuccess(false);
    setOpenError(false);
  };

  // Add the loaner to the firestore "loaners" collection.
  const setLoanerToFirestore = async () => {
    const timestamp = moment().format("DD-MMM-yyyy hh:mmA");
    const id = moment().format("yyyyMMDDHHmmss");
    const changeLog = [
      {
        user: employee,
        change: `Loaner record created`,
        timestamp: timestamp,
      },
    ];

    const firestoreLoaner = {
      id: id,
      timestamp: timestamp,
      employee: employee,
      status: "Out",
      statusTimestamp: dateOut,
      model: model,
      stock: stock,
      serial: serial,
      hours: hours,
      customer: customer,
      changeLog: changeLog,
    };

    const loanerRef = doc(
      db,
      "branches",
      userProfile.branch,
      "loaners",
      firestoreLoaner.id
    );

    await setDoc(loanerRef, firestoreLoaner, { merge: true });

    sendNewLoanerEmail(model, stock, dateOut, customer, employee, userProfile);
    resetForm();
  };

  // Reset the form
  const resetForm = async () => {
    console.log("loaner updated");
    setModel("");
    setStock("");
    setSerial("");
    setHours("");
    setCustomer("");
    setDateOut("");
  };

  // Loaner submission validation.
  const loanerSubmitValidation = async (event) => {
    event.preventDefault();

    const lowerCaseLetters = /[a-z]/g;
    const upperCaseLetters = /[A-Z]/g;
    if (model === "") {
      setValidationMessage("Loaner must have a model");
      setOpenError(true);
      return false;
    } else if (
      stock.length !== 6 ||
      stock.match(lowerCaseLetters) ||
      stock.match(upperCaseLetters)
    ) {
      setValidationMessage("Loaner must have a 6 digit stock number");
      setOpenError(true);
      return false;
    } else if (serial === "") {
      setValidationMessage("Loaner must have a serial number");
      setOpenError(true);
      return false;
    } else if (dateOut === "") {
      setValidationMessage("Loaner must have a date loaned");
      setOpenError(true);
      return false;
    } else if (hours === "") {
      setValidationMessage("Loaner must have hours");
      setOpenError(true);
      return false;
    } else if (customer === "") {
      setValidationMessage("Loaner must have a customer");
      setOpenError(true);
      return false;
    } else {
      await setLoanerToFirestore();
      setValidationMessage("Loaner successfully added");
      setOpenSuccess(true);
    }
  };

  // UI view of the submission form
  return (
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
        <AgricultureRounded color="secondary" fontSize="large" />
      </Avatar>
      <Typography
        key="heading"
        color="primary"
        variant="h5"
        style={{ fontWeight: "bold" }}
      >
        Log Loaned Equipment
      </Typography>
      <form style={{ width: "100%", marginTop: "10px" }} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              key="dateOut"
              name="dateOut"
              variant="outlined"
              type="date"
              required
              fullWidth
              size="small"
              id="dateOut"
              autoFocus
              onChange={(e) => setDateOut(e.target.value)}
              value={dateOut}
              InputLabelProps={{
                shrink: true,
              }}
              label="Date"
            />
          </Grid>
          <Grid item xs={12} sm={6}></Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              key="model"
              name="model"
              variant="outlined"
              required
              fullWidth
              size="small"
              id="model"
              onChange={(e) => setModel(e.target.value.toUpperCase())}
              value={model}
              label="Model"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              key="stock"
              variant="outlined"
              required
              fullWidth
              size="small"
              id="stock"
              label="Stock"
              onChange={(e) => setStock(e.target.value)}
              value={stock}
              name="stock"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              key="serial"
              variant="outlined"
              fullWidth
              size="small"
              required
              id="serial"
              onChange={(e) => setSerial(e.target.value.toUpperCase())}
              value={serial}
              label="Serial"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              key="hours"
              variant="outlined"
              fullWidth
              size="small"
              required
              id="hours"
              onChange={(e) => setHours(e.target.value)}
              value={hours}
              label="Hours"
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField
              key="customer"
              variant="outlined"
              fullWidth
              required
              size="small"
              id="customer"
              label="Customer"
              name="customer"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              type="text"
            />
          </Grid>

          <Snackbar
            key="success"
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
            key="error"
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

              <Grid item xs={5}></Grid>
          <Grid item spacing={2} xs={7}>
            <Button
              size="small"
              variant="contained"
              color="primary"
              endIcon={<SendRounded color="secondary" />}
              onClick={loanerSubmitValidation}
            >
              <Typography color="secondary">Submit Loaner</Typography>
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}
