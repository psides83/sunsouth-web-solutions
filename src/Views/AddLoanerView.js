//Imports
import React, { useState } from 'react'
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import { db } from '../Services/firebase';
import '../Styles/SignUp.css'
import { setDoc, doc } from '@firebase/firestore';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { Alert } from '@mui/material';
import '../Styles/AddRequest.css'
import { useStateValue } from '../StateManagement/StateProvider';
import moment from 'moment';
// import { styled } from '@mui/material/styles';
import Snackbar from '@material-ui/core/Snackbar';
import emailjs from 'emailjs-com';
import { Avatar } from '@material-ui/core';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import { sendNewLoanerEmail } from '../Services/EmailService';

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
    width: 64,
    height: 64,
    margin: theme.spacing(1),
    backgroundColor: theme.palette.primary.main,
  },
  img: {
    padding: 1
  },
  icon: {
    color: theme.palette.secondary.main,
  },
  title: {
    color: theme.palette.primary.main,
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
// function Copyright() {
//   return (
//     <Typography variant="body2" color="textSecondary" align="center">
//       {'Copyright © '}
//       <a href="https://www.instagram.com/thewaymediaco/?utm_medium=copy_link">
//         TheWayMedia Web Solutions
//       </a>{' '}
//       {new Date().getFullYear()}
//       {'.'}
//     </Typography>
//   );
// };

// const ListItem = styled('li')(({ theme }) => ({
//   margin: theme.spacing(0.5),
// }));

export default function AddLoanerView() {  
  //#region State Properties
  const classes = useStyles();
  const [{ userProfile }] = useStateValue();
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openError, setOpenError] = useState(false);
  var [model, setModel] = useState('');
  var [stock, setStock] = useState('');
  var [serial, setSerial] = useState('');
  var [hours, setHours] = useState('');
  var [dateOut, setDateOut] = useState('');
  var [customer, setCustomer] = useState('');
  var [validationMessage, setValidationMessage] = useState('');
  const employee = userProfile?.firstName + ' ' + userProfile?.lastName
  //#endregion

  // Handle closing of the alerts.
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpenSuccess(false);
    setOpenError(false);
  };

  // Add the loaner to the firestore "loaners" collection. 
  const setLoanerToFirestore = async () => {
    
    const timestamp = moment().format("DD-MMM-yyyy hh:mmA")
    const id = moment().format("yyyyMMDDHHmmss")
    const changeLog = [{
      user: employee,
      change: `Loaner record created`,
      timestamp: timestamp
    }]

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
      changeLog: changeLog
    }

    const loanerRef = doc(db, 'branches',  userProfile.branch, 'loaners', firestoreLoaner.id);

    await setDoc(loanerRef, firestoreLoaner, { merge: true });

    sendNewLoanerEmail()
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
    if (model === '') {
        setValidationMessage("Loaner must have a model")
        setOpenError(true)
        return false
    } else if (stock.length !== 6 || stock.match(lowerCaseLetters) || stock.match(upperCaseLetters)) {
        setValidationMessage("Loaner must have a 6 digit stock number")
        setOpenError(true)
        return false
    } else if (serial === '') {
        setValidationMessage("Loaner must have a serial number")
        setOpenError(true)
        return false
    } else if (dateOut === '') {
        setValidationMessage("Loaner must have a date loaned")
        setOpenError(true)
        return false
    } else if (hours === '') {
        setValidationMessage("Loaner must have hours")
        setOpenError(true)
        return false
    } else if (customer === '') {
        setValidationMessage("Loaner must have a customer")
        setOpenError(true)
        return false
    } else {
      await setLoanerToFirestore()
      setValidationMessage("Loaner successfully added")
      setOpenSuccess(true)
    }
  }

  // UI view of the submission form
  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box className={classes.paper}>
        <Avatar className={classes.avatar}>
          <AgricultureIcon className={classes.icon} fontSize="large" />
        </Avatar>
        <Typography component="h1" variant="h" className={classes.title}>
          Log Loaned Equipment
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
      {/* <Box mt={5}>
        <Copyright />
      </Box> */}
    </Container>
  );
}