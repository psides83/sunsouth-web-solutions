//Imports
import React, { useState } from 'react'
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import { db } from '../Services/firebase';
import '../Styles/SignUp.css'
import { setDoc, doc } from '@firebase/firestore';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { FormGroup } from '@material-ui/core';
import { Alert, Stack } from '@mui/material';
import '../Styles/AddRequest.css'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useStateValue } from '../StateManagement/StateProvider';
import moment from 'moment';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import { styled } from '@mui/material/styles';
import Chip from '@mui/material/Chip';
import Snackbar from '@material-ui/core/Snackbar';
import emailjs from 'emailjs-com';

// Sets useStyles for customizing Material UI components.
const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    width: 192,
    height: 160,
    margin: theme.spacing(1),
    // backgroundColor: ,
  },
  img: {
    padding: 1
  },
  icon: {
    color: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
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
    '&:before': {
        borderColor: theme.palette.secondary.main,
    },
    '&:after': {
        borderColor: theme.palette.secondary.main,
    },
    '&:not(.Mui-disabled):hover::before': {
        borderColor: theme.palette.secondary.main,
    },
  },
}));

// copyright view at the footer of the page.
function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {'Copyright © '}
      <a href="https://www.instagram.com/thewaymediaco/?utm_medium=copy_link">
        TheWayMedia Web Solutions
      </a>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
};

const ListItem = styled('li')(({ theme }) => ({
  margin: theme.spacing(0.5),
}));


export default function AddRequestView() {  
  //#region State Properties
  const classes = useStyles();
  const [{ userProfile }] = useStateValue();
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openError, setOpenError] = useState(false);
  var [model, setModel] = useState('');
  var [stock, setStock] = useState('');
  var [serial, setSerial] = useState('');
  var [work, setWork] = useState([]);
  var [notes, setNotes] = useState('');
  var [other, setOther] = useState('');
  var [checked1, setChecked1] = useState(false);
  var [checked2, setChecked2] = useState(false);
  var [checked3, setChecked3] = useState(false);
  var [checked4, setChecked4] = useState(false);
  var [checked5, setChecked5] = useState(false);
  var [checked6, setChecked6] = useState(false);
  var [checked7, setChecked7] = useState(false);
  var [checked8, setChecked8] = useState(false);
  var [equipmentList, setEquepmentList] = useState([]);
  var [otherDisabled, setOtherState] = useState(true);
  var [eqString] = useState([]);
  var [validationMessage, setValidationMessage] = useState('');
  const fullName = userProfile?.firstName + ' ' + userProfile?.lastName
  //#endregion

  // Handle closing of the alerts.
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpenSuccess(false);
    setOpenError(false);
  };

  // Dynamic heading for the form.
  const heading = equipmentList.length === 0 ? "Add Equipment" : "Equipment on Request"

  // Array of work options that populate the checkbox setion of the form.
  var workOptions = [
    {
      id: '1',
      work: 'PDI',
      checkedState: checked1
    },
    {
      id: '2',
      work: 'Water in tires',
      checkedState: checked2
    }, {
      id: '3',
      work: 'Mount to listed tractor/CCE machine',
      checkedState: checked3
    }, {
      id: '4',
      work: 'Add 3rd function',
      checkedState: checked4
    }, {
      id: '5',
      work: 'Install radio',
      checkedState: checked5
    }, {
      id: '6',
      work: 'Mount canopy',
      checkedState: checked6
    }, {
      id: '7',
      work: 'Widen tires',
      checkedState: checked7
  }]

  // Set the state of the "other" checkbox. It's disabled if the textfield is empty.
  const enableOther = (event) => {
    setOther(event.target.value)

    if (event.target.value !== '') {
      setOtherState(false)
    } else if (event.target.value === '') {
      setOtherState(true)
    }
  }

  // Handle deleting of equipment from the request.
  const handleDelete = (equipmentToDelete) => () => {
    setEquepmentList((equipmentList) => equipmentList.filter((equiment) => equiment.id !== equipmentToDelete.id));
  };

  // Handle changes in the checkboxes.
  const handleChange = (event) => {
    switch (event.target.id) {
        case "1":
          if (!checked1) {
            setChecked1(true)
            work[0] =event.target.value
            setWork(work)
          } else {
            setChecked1(false)
            work[0] = null
            setWork(work)
          };
          break;
        case "2":
            if (!checked2) {
              setChecked2(true)
              work[1] = event.target.value
              setWork(work)
            } else {
              setChecked2(false)
              work[1] = null
              setWork(work)
            };
            break;
        case "3":
            if (!checked3) {
              setChecked3(true)
              work[2] = event.target.value
              setWork(work)
            } else {
              setChecked3(false)
              work[2] = null
              setWork(work)
            };
            break;
        case "4":
            if (!checked4) {
              setChecked4(true)
              work[3] = event.target.value
              setWork(work)
            } else {
              setChecked4(false)
              work[3] = null
              setWork(work)
            };
            break;
        case "5":
            if (!checked5) {
              setChecked5(true)
              work[4] = event.target.value
              setWork(work)
            } else {
              setChecked5(false)
              work[4] = null
              setWork(work)
            };
            break;
        case "6":
            if (!checked6) {
              setChecked6(true)
              work[5] = event.target.value
              setWork(work)
            } else {
              setChecked6(false)
              work[5] = null
              setWork(work)
            };
            break;
        case "7":
            if (!checked7) {
              setChecked7(true)
              work[6] = event.target.value
              setWork(work)
            } else {
              setChecked7(false)
              work[6] = null
              setWork(work)
            };
            break;
        case "8":
            if (!checked8) {
              setChecked8(true)
              work[7] = event.target.value
              setWork(work)
            } else {
              setChecked8(false)
              work[7] = null
              setWork(work)
            };
            break;
        default: break;
      }

      var temp = [];
      
      for(let i of work)
      i && temp.push(i); // copy each non-empty value to the 'temp' array

      work = temp; 

      console.log(work.toString().replace(/,[s]*/g, ", "));
  };

  // Add the request to the firestore "requests" collection and the equipment to the fire store "equipment" collection. 
  const setRequestToFirestore = async () => {
    
    const timestamp = moment().format("MMM-DD-yyyy hh:mmA")
    const id = moment().format("yyyyMMDDHHmmss")
    const salesman = userProfile?.firstName + ' ' + userProfile?.lastName
    const changeLog = [{
      user: fullName,
      change: `request created`,
      timestamp: timestamp
    }]

    const firestoreRequest = {
      id: id,
      timestamp: timestamp,
      salesman: salesman,
      status: "Requested",
      statusTimestamp: timestamp,
      workOrder: "", 
      changeLog: changeLog
    }

    const requestRef = doc(db, 'branches',  userProfile.branch, 'requests', firestoreRequest.id);

    await setDoc(requestRef, firestoreRequest, { merge: true });

    for (var i= 0; i < equipmentList.length ; i++) {
      const equipment = {
        requestID: firestoreRequest.id,
        timestamp: firestoreRequest.timestamp,
        model: equipmentList[i].model,
        stock: equipmentList[i].stock,
        serial: equipmentList[i].serial,
        work: equipmentList[i].work,
        notes: equipmentList[i].notes,
        changeLog: equipmentList[i].changeLog
      }
      
      const equipmentRef = doc(db, 'branches',  userProfile.branch, 'requests', firestoreRequest.id, 'equipment', equipment.stock);
      await setDoc(equipmentRef, equipment, { merge: true });
    }

    sendEmail(timestamp)
    resetForm()
    setEquepmentList([])
  } 

  // Reset the form
  const resetForm = async () => {

    console.log("request updated")
    setModel("")
    setStock("")
    setSerial("")
    setNotes("")
    setOther("")
    setChecked1(false)
    setChecked2(false)
    setChecked3(false)
    setChecked4(false)
    setChecked5(false)
    setChecked6(false)
    setChecked7(false)
    setChecked8(false)
    setWork([])
  }

  // Push equipment to a state array to later be set to firestore "equipment" collection with the "requests" collection.
  const pushEquipmentToRequest = async () => {

    var workString = work.toString().replace(/,[s]*/g, ", ")
    
    if (workString[0] === ',') {
      workString = workString.substring(1).trim()
    }

    const changeLog = [{
      user: fullName,
      change: `equipment added to request`,
      timestamp: moment().format("MMM-DD-yyyy hh:mmA")

    }]

    var equipment = {
      id: equipmentList.length + 1,
      model: model,
      stock: stock,
      serial: serial,
      work: workString,
      notes: notes,
      changeLog: changeLog
    }

    
    eqString.push(equipment.model)
    console.log(eqString)

    equipmentList.push(equipment)
    setEquepmentList(equipmentList)
    console.log("Temp EQ")
    console.log(equipmentList)
    
    await resetForm()
  }

  // Squipment submission validation.
  const equipmentSubmitValidation = async (event) => {
    event.preventDefault()  

    const lowerCaseLetters = /[a-z]/g;
    const upperCaseLetters = /[A-Z]/g;

    if (model === '') {
      setValidationMessage("Equipment must have a model to be added to a request")
      setOpenError(true)
      return
    } else if (stock.length !== 6 || stock.match(lowerCaseLetters) || stock.match(upperCaseLetters)) {
      setValidationMessage("Equipment must have a 6 digit stock number to be added to a request")
      setOpenError(true)
      return
    } else if (serial === '') {
      setValidationMessage("Equipment must have a serial number to be added to a request")
      setOpenError(true)
      return
    } else if (work.length === 0) {
      setValidationMessage("Equipment must have a work requested to be added to a request")
      setOpenError(true)
      return
    } else {
      pushEquipmentToRequest()
      const lastIndex = equipmentList[equipmentList.length - 1]?.model;
      setValidationMessage(lastIndex + " successfully added to the request")
      setOpenSuccess(true)
    }
  }

  // Requst submission validation.
  const requestSubmitValidation = async (event) => {
    event.preventDefault()  

    const lowerCaseLetters = /[a-z]/g;
    const upperCaseLetters = /[A-Z]/g;

    if (model === '' && equipmentList.length === 0) {
      setValidationMessage("Equipment must have a model to be added to a request")
      setOpenError(true)
      return false
    } else if ((stock.length !== 6 || stock.match(lowerCaseLetters) || stock.match(upperCaseLetters)) && equipmentList.length === 0) {
      setValidationMessage("Equipment must have a 6 digit stock number to be added to a request")
      setOpenError(true)
      return false
    } else if (serial === '' && equipmentList.length === 0) {
      setValidationMessage("Equipment must have a serial number to be added to a request")
      setOpenError(true)
      return false
    } else if (work.length === 0 && equipmentList.length === 0) {
      setValidationMessage("Equipment must have a work requested to be added to a request")
      setOpenError(true)
      return false
    } else if ((model === '' || stock === '' || serial === '' || work.length === 0) && equipmentList > 0) {
      await setRequestToFirestore()
      setValidationMessage("Request successfully submitted")
      setOpenSuccess(true)
    } else {
      await pushEquipmentToRequest()
      await setRequestToFirestore()
      setValidationMessage("Request successfully submitted")
      setOpenSuccess(true)
    }
  }

  const sendEmail = (timestamp) => {

    const recipients = "mallen@sunsouth.com, svcwriter11@sunsouth.com, parts11@sunsouth.com"
    const subject = `${fullName}, ${equipmentList[0].model}, ${equipmentList[0].stock}, ${equipmentList[0].serial}`

    var body = `<body>`;

    body +=  `<section>
                <p>${timestamp}</p>
                <p>${fullName} is requesting work to be done on the following equipment.</p>
              </section>`;
          
    for (var i = 0; i < equipmentList.length; i++) {

      body +=  `<hr style="height:3px;border-width:0;color:gray;background-color:gray">
                <section>
                  <h3>Equipment ${i + 1}</h3>
                  <p>Model: ${equipmentList[i].model}</p>
                  <p>Stock Number: ${equipmentList[i].stock}</p>
                  <p>Serial Number: ${equipmentList[i].serial}</p>
                  <p>Work Required: ${equipmentList[i].work}</p>
                  <p>Additional Notes: ${equipmentList[i].notes}</p>
                </section>`
    }

    body += '<body>';

    const templateParams = {
      to: "psides83@hotmail.com",
      replyTo: userProfile.email, 
      from: "PDI/Setup Requests", 
      copy: userProfile.email,
      subject: subject,
      message: body
    }

    emailjs.send('service_5guvozs', 'template_5dg1ys6', templateParams, 'user_3ub5f4KJJHBND1Wzl1FQi')
  }

  // UI view of the submission form
  return (
    <Container component="main" maxWidth="xs" sx={{ margin: 20 }}>
      <CssBaseline />
      <Box className={classes.paper}>
        {/* <Avatar className={classes.avatar}> */}
          {/* <img src="/ss-logo.png" alt="" className={classes.img}/> */}
          {/* <SendRoundedIcon className={classes.icon} /> */}
        {/* </Avatar> */}
        <Typography component="h1" variant="h">
          Submit PDI/Setup Request
        </Typography>
        <form className={classes.form} noValidate>
        <Stack mb={1}>
            <Typography component="h1" variant="h6">
                {heading}
            </Typography>

            <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignContent: 'center',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  listStyle: 'none',
                  p: 0.5,
                  m: 0,
                }}
                component="ul"
              >
                {equipmentList.map((data) => {
                  let icon = <AgricultureIcon />;

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
                autoComplete="fname"
                name="model"
                variant="outlined"
                required
                fullWidth
                size="small"
                id="model"
                label="Model"
                autoFocus
                onChange={e=> setModel(e.target.value.toUpperCase())}
                value={model}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                variant="outlined"
                required
                fullWidth
                size="small"
                id="stock"
                label="Stock"
                name="stock"
                onChange={e=> setStock(e.target.value)}
                value={stock}
              />
            </Grid>
            <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  labelId="serial"
                  fullWidth
                  size="small"
                  required
                  id="serial"
                  label="Serial"
                  onChange={e=> setSerial(e.target.value.toUpperCase())}
                  value={serial}
                >
                </TextField>
            </Grid>
                <Grid item xs={12}>
                    <div className="checkBoxes">
                        <FormGroup>
                            <Typography variant="h6">Work Required*</Typography>      
                            {workOptions.map(option => (
                              <FormControlLabel control={<Checkbox id={option.id} checked={option.checkedState} onChange={handleChange} color="primary" value={option.work}/>} label={option.work} />
                            ))}
                            <Stack direction="row">
                                <FormControlLabel control={<Checkbox id="8" checked={checked8} onChange={handleChange} disabled={otherDisabled} color="primary" value={other}/>} label="Other:" />
                                <TextField
                                labelId="serial"
                                fullWidth
                                size="small"
                                id="other"
                                value={other}
                                onChange={enableOther}
                                >
                                </TextField>
                            </Stack>
                        </FormGroup>
                    </div>
                </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                fullWidth
                size="small"
                id="notes"
                label="Addtional Notes"
                name="notes"
                type="text"
                value={notes} 
                onChange="{e=> setEmail(e.target.value)}"
              />
            </Grid>
          </Grid >

          <Snackbar open={openSuccess} autoHideDuration={3000} onClose={handleClose}>
            <Alert  onClose={handleClose} severity="success" sx={{ width: '100%' }}>
              {validationMessage}
            </Alert>
          </Snackbar>

          <Snackbar open={openError} autoHideDuration={3000} onClose={handleClose}>
            <Alert  onClose={handleClose} severity="error" sx={{ width: '100%' }}>
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