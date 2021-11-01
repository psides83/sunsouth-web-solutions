//Imports
import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom';
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
import { auth, db } from './firebase';
import './SignUp.css'
import { setDoc, doc } from '@firebase/firestore';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { FormGroup } from '@material-ui/core';
import { Alert, Stack } from '@mui/material';
import './AddRequest.css'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useStateValue } from './StateProvider';
import moment from 'moment';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import { styled } from '@mui/material/styles';
import Chip from '@mui/material/Chip';
import Snackbar from '@material-ui/core/Snackbar';
import emailjs from 'emailjs-com';

//#region Unused imports
// import Paper from '@mui/material/Paper';
// import Avatar from '@material-ui/core/Avatar';
// import Link from '@material-ui/core/Link';
// import { createUserWithEmailAndPassword } from "firebase/auth";
// import InputLabel from '@mui/material/InputLabel';
// import MenuItem from '@mui/material/MenuItem';
// import FormControl from '@mui/material/FormControl';
// import Select from '@mui/material/Select';
// import OutlinedInput from '@mui/material/OutlinedInput';
//#endregion

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
      <a target="_blank" href="https://www.instagram.com/thewaymediaco/?utm_medium=copy_link">
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


export default function AddLoanerView() {  
  //#region State Properties
  const classes = useStyles();
  const history = useHistory();
  const [{ userProfile }] = useStateValue();
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openError, setOpenError] = useState(false);
  var [model, setModel] = useState('');
  var [stock, setStock] = useState('');
  var [serial, setSerial] = useState('');
  var [hours, setHours] = useState([]);
  var [dateOut, setDateOut] = useState('');
  var [other, setOther] = useState('');
  var [customer, setCustomer] = useState('');
  var [otherDisabled, setOtherState] = useState(true);
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

  // Handle change of date picker.
  const handleChange = (newValue) => {
    setDateOut(newValue);
  };

  // Dynamic heading for the form.
  const heading = ""

  // Add the loaner to the firestore "loaners" collection. 
  const setLoanerToFirestore = async () => {
    
    const timestamp = moment().format("MMM-DD-yyyy hh:mmA")
    const id = moment().format("yyyyMMDDHHmmss")
    const employee = userProfile?.firstName + ' ' + userProfile?.lastName
    // const changeLog = [{
    //   user: fullName,
    //   change: `request created`,
    //   timestamp: timestamp
    // }]

    const firestoreLoaner = {
      id: id,
      timestamp: timestamp,
      employee: employee,
      status: "Out",
      statusTimestamp: "",
      dateOut: dateOut, 
      model: model,
      stock: stock,
      serial: serial,
      hours: hours,
      customer: customer
    }

    const loanerRef = doc(db, 'branches',  userProfile.branch, 'loaners', firestoreLoaner.id);

    await setDoc(loanerRef, firestoreLoaner, { merge: true });

    // sendEmail(timestamp)
    resetForm()
  } 

  // Reset the form
  const resetForm = async () => {

    console.log("loaner updated")
    setModel("")
    setStock("")
    setSerial("")
    setHours("")
    setCustomer("")
    setDateOut("")
  }

  // Loaner submission validation.
  const loanerSubmitValidation = async (event) => {
    event.preventDefault()  

    const lowerCaseLetters = /[a-z]/g;
    const upperCaseLetters = /[A-Z]/g;
    if (model == '') {
        setValidationMessage("Loaner must have a model")
        setOpenError(true)
        return false
    } else if (stock.length !== 6 || stock.match(lowerCaseLetters) || stock.match(upperCaseLetters)) {
        setValidationMessage("Loaner must have a 6 digit stock number")
        setOpenError(true)
        return false
    } else if (serial == '') {
        setValidationMessage("Loaner must have a serial number")
        setOpenError(true)
        return false
    } else if (dateOut == '') {
        setValidationMessage("Loaner must have a date loaned")
        setOpenError(true)
        return false
    } else if (hours == '') {
        setValidationMessage("Loaner must have hours")
        setOpenError(true)
        return false
    } else if (customer == '') {
        setValidationMessage("Loaner must have a customer")
        setOpenError(true)
        return false
    } else {
      await setLoanerToFirestore()
      setValidationMessage("Loaner successfully added")
      setOpenSuccess(true)
    }
  }

//   const sendEmail = (timestamp) => {

//     const recipients = "mallen@sunsouth.com, svcwriter11@sunsouth.com, parts11@sunsouth.com"
//     const subject = fullName + ', ' + equipmentList[0].model + ', ' + equipmentList[0].stock + ', ' + equipmentList[0].serial

//     var body = '<body>';

//     body += '<section>' + '<p>' + timestamp + '</p>' + '<p>' + fullName + " is requesting work to be done on the following equipment." + '</p>' + '<hr style="height:3px;border-width:0;color:gray;background-color:gray">' + '<h3>' + "First Equipment".bold() + '</h3>' + '<p>' + "Model: " + equipmentList[0].model + '</p>' + '<p>' + "Stock Number: " + equipmentList[0].stock + '</p>' + '<p>' + "Serial Number: " + equipmentList[0].serial + '</p>' + '<p>' + "Work Required: " + equipmentList[0].work + '</p>' + '<p>' + "Additional Notes: " + equipmentList[0].notes + '</p>' + '</section>';
    
//     if(equipmentList.length == 2) {body += '<hr style="height:3px;border-width:0;color:gray;background-color:gray">' + '<section>' + '<h3>' + "Second Equipment".bold() + '</h3>' + '<p>' + "Model: " + equipmentList[1].model + '</p>' + '<p>' + "Stock Number: " + equipmentList[1].stock + '</p>' + '<p>' + "Serial Number: " + equipmentList[1].serial + '</p>' + '<p>' + "Work Required: " + equipmentList[1].work + '</p>' + '<p>' + "Additional Notes: " + equipmentList[1].notes + '</p>' + '</section>'};

//     if(equipmentList.length == 3) {body += '<hr style="height:3px;border-width:0;color:gray;background-color:gray">' + '<section>' + '<h3>' + "Third Equipment".bold() + '</h3>' + '<p>' + "Model: " + equipmentList[2].model + '</p>' + '<p>' + "Stock Number: " + equipmentList[2].stock + '</p>' + '<p>' + "Serial Number: " + equipmentList[2].serial + '</p>' + '<p>' + "Work Required: " + equipmentList[2].work + '</p>' + '<p>' + "Additional Notes: " + equipmentList[2].notes + '</p>' + '</section>'};

//     if(equipmentList.length == 4) {body += '<hr style="height:3px;border-width:0;color:gray;background-color:gray">' + '<section>' + '<h3>' + "Fourth Equipment".bold() + '</h3>' + '<p>' + "Model: " + equipmentList[3].model + '</p>' + '<p>' + "Stock Number: " + equipmentList[3].stock + '</p>' +  '<p>' + "Serial Number: " + equipmentList[3].serial + '</p>' + '<p>' + "Work Required: " + equipmentList[3].work + '</p>' + '<p>' + "Additional Notes: " + equipmentList[3].notes + '</p>' + '</section>'};

//     if(equipmentList.length == 5) {body += '<hr style="height:3px;border-width:0;color:gray;background-color:gray">' + '<section>' + '<h3>' + "Fifth Equipment".bold() + '</h3>' + '<p>' + "Model: " + equipmentList[4].model + '</p>' + '<p>' + "Stock Number: " + equipmentList[4].stock + '</p>' + '<p>' + "Serial Number: " + equipmentList[4].serial + '</p>' + '<p>' + "Work Required: " + equipmentList[4].work + '</p>' + '<p>' + "Additional Notes: " + equipmentList[4].notes + '</p>' + '</section>'};

//     if(equipmentList.length == 6) {body += '<hr style="height:3px;border-width:0;color:gray;background-color:gray">' + '<section>' + '<h3>' + "Sith Equipment".bold() + '</h3>' + '<p>' + "Model: " + equipmentList[5].model + '</p>' + '<p>' + "Stock Number: " + equipmentList[5].stock + '</p>' + '<p>' + "Serial Number: " + equipmentList[5].serial + '</p>' + '<p>' + "Work Required: " + equipmentList[5].work + '</p>' + '<p>' + "Additional Notes: " + equipmentList[5].notes + '</p>' + '</section>'};

//     if(equipmentList.length == 7) {body += '<hr style="height:3px;border-width:0;color:gray;background-color:gray">' + '<section>' + '<h3>' + "Seventh Equipment".bold() + '</h3>' + '<p>' + "Model: " + equipmentList[6].model + '</p>' + '<p>' + "Stock Number: " + equipmentList[6].stock + '</p>' + '<p>' + "Serial Number: " + equipmentList[6].serial + '</p>' + '<p>' + "Work Required: " + equipmentList[6].work + '</p>' + '<p>' + "Additional Notes: " + equipmentList[6].notes + '</p>' + '</section>'};

//     if(equipmentList.length == 8) {body += '<hr style="height:3px;border-width:0;color:gray;background-color:gray">' + '<section>' + '<h3>' + "Eihght Equipment".bold() + '</h3>' + '<p>' + "Model: " + equipmentList[7].model + '</p>' + '<p>' + "Stock Number: " + equipmentList[7].stock + '</p>' + '<p>' + "Serial Number: " + equipmentList[7].serial + '</p>' + '<p>' + "Work Required: " + equipmentList[7].work + '</p>' + '<p>' + "Additional Notes: " + equipmentList[7].notes + '</p>' + '</section>'};

//     body += '<body>';

//     const templateParams = {
//       to: "psides83@hotmail.com",
//       replyTo: userProfile.email, 
//       from: "PDI/Setup Requests", 
//       copy: userProfile.email,
//       subject: subject,
//       message: body
//     }

//     emailjs.send('service_5guvozs', 'template_5dg1ys6', templateParams, 'user_3ub5f4KJJHBND1Wzl1FQi')
//   }

  // UI view of the submission form
  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box className={classes.paper}>
        {/* <Avatar className={classes.avatar}> */}
          <img src="/ss-logo.png" alt="" className={classes.img} id="logo" style={{ marginBottom: "15px" }}/>
          {/* <SendRoundedIcon className={classes.icon} /> */}
        {/* </Avatar> */}
        <Typography component="h1" variant="h4">
          Add Loaner
        </Typography>
        <form className={classes.form} noValidate>
        {/* <Stack mb={1}>
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
            
            </Stack> */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                  name="dateOut"
                  variant="outlined"
                  type="date"
                  required
                  fullWidth
                  size="small"
                  id="dateOut"
                  label="Date"
                  labelId="dateOut"
                  autoFocus
                  onChange={e=> setDateOut(e.target.value)}
                  value={dateOut}
                  InputLabelProps={{
                    shrink: true,
                  }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="model"
                variant="outlined"
                required
                fullWidth
                size="small"
                id="model"
                label="Model"
                labelId="model"
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
                labelId="stock"
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
                  labelId="sseial"
                  onChange={e=> setSerial(e.target.value.toUpperCase())}
                  value={serial}
                >
                </TextField>
            </Grid>
                <Grid item xs={12} sm={4}>
                <TextField
                  variant="outlined"
                  labelId="hours"
                  fullWidth
                  size="small"
                  required
                  id="hours"
                  label="Hours"
                  onChange={e=> setHours(e.target.value)}
                  value={hours}
                >
                </TextField>
                </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                variant="outlined"
                fullWidth
                required
                size="small"
                id="customer"
                label="Customer"
                labelId="customer"
                name="customer"
                type="text"
                value={customer} 
                onChange={e=> setCustomer(e.target.value)}
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

          <Grid container justifyContent="flex-end">
            {/* <Button
                variant="outlined"
                color="primary"
                startIcon={<AddCircleOutlineIcon />}
                className={classes.addEquipment}
                onClick={equipmentSubmitValidation}
            >
                Add More Equipment
            </Button> */}
            <Button
                variant="contained"
                color="primary"
                endIcon={<SendRoundedIcon className={classes.submitIcon} />}
                className={classes.submit}
                onClick={loanerSubmitValidation}
            >
                <p className={classes.submitIcon}>Submit Loaner</p>
            </Button>
          </Grid>
          
        </form>
      </Box>
      <Box mt={5}>
        <Copyright />
      </Box>
    </Container>
  );
}