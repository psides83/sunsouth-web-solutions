//Imports
import React, { useState } from "react";
import { db } from "../services/firebase";
import "../styles/SignUp.css";
import { setDoc, doc } from "@firebase/firestore";
import "../styles/AddRequest.css";
import { useStateValue } from "../state-management/StateProvider";
import moment from "moment";
import { sendNewRequestEmail } from "../services/email-service";
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
  Snackbar,
  Stack,
  styled,
  TextField,
  Typography,
} from "@mui/material";
import {
  AddCircleOutline,
  Agriculture,
  AgricultureRounded,
  SendRounded,
} from "@mui/icons-material";

const ListItem = styled("li")(({ theme }) => ({
  margin: theme.spacing(0.5),
}));

export default function AddRequestView() {
  //#region State Properties
  const [{ userProfile }] = useStateValue();
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openError, setOpenError] = useState(false);
  var [model, setModel] = useState("");
  var [stock, setStock] = useState("");
  var [serial, setSerial] = useState("");
  var [work, setWork] = useState([]);
  var [notes, setNotes] = useState("");
  var [other, setOther] = useState("");
  var [checked1, setChecked1] = useState(false);
  var [checked2, setChecked2] = useState(false);
  var [checked3, setChecked3] = useState(false);
  var [checked4, setChecked4] = useState(false);
  var [checked5, setChecked5] = useState(false);
  var [checked6, setChecked6] = useState(false);
  var [checked7, setChecked7] = useState(false);
  var [checked8, setChecked8] = useState(false);
  var [equipmentList, setEquepmentList] = useState([]);
  var [otherDisabled, setOtherDisabled] = useState(true);
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
      work: "Add 3rd function",
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
  ];

  // Set the state of the "other" checkbox. It's disabled if the textfield is empty.
  const enableOther = (event) => {
    setOther(event.target.value);

    work[7] = other
    setWork(work)

    if (event.target.value !== "") {
      setOtherDisabled(false);
      setChecked8(true)
    } else if (event.target.value === "") {
      setOtherDisabled(true);
      setChecked8(false)
    }
  };

  // Handle deleting of equipment from the request.
  const handleDelete = (equipmentToDelete) => () => {
    setEquepmentList((equipmentList) =>
      equipmentList.filter((equiment) => equiment.id !== equipmentToDelete.id)
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
        } else {
          setChecked7(false);
          work[6] = null;
          setWork(work);
        }
        break;
      case "8":
        if (!checked8) {
          setChecked8(true);
          // work[7] = event.target.value;
          // setWork(work);
        } else {
          setChecked8(false);
          // work[7] = null;
          // setWork(work);
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
      {
        user: fullName,
        change: `request created`,
        timestamp: timestamp,
      },
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
      firestoreRequest.id
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
        changeLog: equipmentList[i].changeLog,
      };

      const equipmentRef = doc(
        db,
        "branches",
        userProfile.branch,
        "requests",
        firestoreRequest.id,
        "equipment",
        equipment.stock
      );
      await setDoc(equipmentRef, equipment, { merge: true });
    }

    sendNewRequestEmail(
      timestamp,
      equipmentList,
      fullName,
      userProfile,
      salesman
    );
    resetForm();
    setEquepmentList([]);
  };

  // Reset the form
  const resetForm = async () => {
    setModel("");
    setStock("");
    setSerial("");
    setNotes("");
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
    setWork([]);
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

    console.log(workString)

    const changeLog = [
      {
        user: fullName,
        change: `equipment added to request`,
        timestamp: moment().format("DD-MMM-yyyy hh:mmA"),
      },
    ];

    var equipment = {
      id: equipmentList.length + 1,
      model: model,
      stock: stock,
      serial: serial,
      work: workString,
      notes: notes,
      changeLog: changeLog,
    };

    equipmentList.push(equipment);
    setEquepmentList(equipmentList);
    console.log("Temp EQ");
    console.log(equipmentList);

    await resetForm();
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
    } else if (work.length === 0) {
      setValidationMessage(
        "Equipment must have a work requested to be added to a request"
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
    } else if (work.length === 0 && equipmentList.length === 0) {
      setValidationMessage(
        "Equipment must have a work requested to be added to a request"
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
        serial !== "" &&
        work.length !== 0
      ) {
        console.log("another eq added first");
        await pushEquipmentToRequest();
      }
      await setRequestToFirestore();
      setValidationMessage("Request successfully submitted");
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
        maxWidth: "400px",
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
        Submit PDI/Setup Request
      </Typography>

      <form style={{ width: "100%", marginTop: "10px" }} noValidate>
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
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              variant="outlined"
              required
              fullWidth
              size="small"
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
            <div className="checkBoxes">
              <FormGroup>
                <Typography variant="h6" style={{ fontSize: 18 }}>
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
              </FormGroup>
            </div>
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
      </form>
    </Box>
  );
}
