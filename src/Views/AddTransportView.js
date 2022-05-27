//Imports
import React, { useState } from "react";
import { db } from "../services/firebase";
import "../styles/SignUp.css";
import { setDoc, doc } from "@firebase/firestore";
import "../styles/AddRequest.css";
import { useStateValue } from "../state-management/StateProvider";
import moment from "moment";
import { sendNewTransportRequestEmail } from "../services/email-service";
import { states } from "../models/states";
import { PhoneNumberMask } from "../components/phone-number-mask";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  Grid,
  MenuItem,
  Snackbar,
  Stack,
  styled,
  TextField,
  Typography,
} from "@mui/material";
import {
  AddCircleOutline,
  AgricultureRounded,
  LocalShippingRounded,
  SendRounded,
} from "@mui/icons-material";

const ListItem = styled("li")(({ theme }) => ({
  margin: theme.spacing(0.5),
}));

export default function AddTransportView(props) {
  //#region State Properties
  const [{ userProfile }] = useStateValue();
  const { handleCloseAddTansportView } = props;
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openError, setOpenError] = useState(false);
  var [name, setName] = useState("");
  var [phone, setPhone] = useState("");
  var [street, setStreet] = useState("");
  var [city, setCity] = useState("");
  var [state, setState] = useState("AL");
  var [zip, setZip] = useState("");
  var [requestedDate, setRequestedDate] = useState("");
  var [type, setType] = useState("Delivery");
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
      requestedDate: requestedDate,
      name: name,
      phone: phone,
      street: street,
      city: city,
      state: state,
      zip: zip,
      type: type,
      hasTrade: hasTrade,
      notes: requestNotes,
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

    sendNewTransportRequestEmail(
      timestamp,
      firestoreTransportRequest,
      fullName,
      userProfile,
      salesman
    );
    resetTransportForm();
    resetEquipmentForm();
    setEquipmentList([]);
    handleCloseAddTansportView();
  };

  // Reset the form
  const resetEquipmentForm = async () => {
    setModel("");
    setStock("");
    setSerial("");
    setNotes("");
    console.log("form reset");
  };

  // reset transport form
  const resetTransportForm = () => {
    setName("");
    setPhone("");
    setStreet("");
    setCity("");
    setState("");
    setZip("");
    setRequestedDate("");
    setType("");
    setHasTrade(false);
    setRequestNotes("");
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

  // checks form validation to activate submit buton
  const submitIsDisabled = () => {
    const lowerCaseLetters = /[a-z]/g;
    const upperCaseLetters = /[A-Z]/g;

    if (
      requestedDate === "" ||
      name === "" ||
      phone === "" ||
      street === "" ||
      city === "" ||
      state === "" ||
      zip === "" ||
      type === ""
    )
      return true;

    if (model === "" && equipmentList.length === 0) return true;
    if (
      (stock.length !== 6 ||
        stock.match(lowerCaseLetters) ||
        stock.match(upperCaseLetters)) &&
      equipmentList.length === 0
    )
      return true;

    if (serial === "" && equipmentList.length === 0) return true;
  };

  // checks form validation to activate submit buton
  const equipmentSubmitIsDisabled = () => {
    const lowerCaseLetters = /[a-z]/g;
    const upperCaseLetters = /[A-Z]/g;

    if (
      model === "" ||
      stock.length !== 6 ||
      stock.match(lowerCaseLetters) ||
      stock.match(upperCaseLetters) ||
      serial === ""
    )
      return true;
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

  // Handle name input and capitolize each word
  const handleNameInput = (e) => {
    const names = e.target.value;

    const finalName = names.replace(/(^\w{1})|(\s+\w{1})/g, (letter) =>
      letter.toUpperCase()
    );

    setName(finalName);
  };

  // Handle street input and capitolize each word
  const handleStreetInput = (e) => {
    const words = e.target.value;

    const finalStreet = words.replace(/(^\w{1})|(\s+\w{1})/g, (letter) =>
      letter.toUpperCase()
    );

    setStreet(finalStreet);
  };

  // Handle street input and capitolize each word
  const handleCityInput = (e) => {
    const words = e.target.value;

    const finalCity = words.replace(/(^\w{1})|(\s+\w{1})/g, (letter) =>
      letter.toUpperCase()
    );

    setCity(finalCity);
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
              id="phone"
              label="Phone Number"
              name="phone"
              InputProps={{
                inputComponent: PhoneNumberMask,
              }}
              onChange={(e) =>
                setPhone(e.target.value.replace(/[^0-9\-()" "]/g, ""))
              }
              value={phone}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
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
              onChange={(e) => setState(e.target.value)}
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
              id="zip"
              label="Zip"
              name="zip"
              onChange={(e) => setZip(e.target.value)}
              value={zip}
            />
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
              onChange={(e) => setType(e.target.value)}
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
                    color="primary"
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
              disabled={equipmentSubmitIsDisabled()}
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
              disabled={submitIsDisabled()}
              endIcon={
                <SendRounded color={submitIsDisabled() ? "" : "secondary"} />
              }
              onClick={requestSubmitValidation}
            >
              <Typography color={submitIsDisabled() ? "" : "secondary"}>
                Submit
              </Typography>
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
      </form>
    </Box>
  );
}
