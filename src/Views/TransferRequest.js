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
import '../styles/SignUp.css'
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { Alert } from '@mui/material';
import '../styles/AddRequest.css'
import { useStateValue } from '../state-management/StateProvider';
// import { styled } from '@mui/material/styles';
import Snackbar from '@material-ui/core/Snackbar';
import { Avatar, MenuItem } from '@material-ui/core';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import { branches } from '../components/branches';

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

export default function TransferRequestView({emails}) {  
  //#region State Properties
  const classes = useStyles();
  const [{ userProfile }] = useStateValue();
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openError, setOpenError] = useState(false);
//   var [branch, setBranch] = useState('');
  var [model, setModel] = useState('');
  var [stock, setStock] = useState('');
  var [validationMessage, setValidationMessage] = useState('');
  //#endregion

  // Handle closing of the alerts.
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpenSuccess(false);
    setOpenError(false);
  };

  // Reset the form
  const resetForm = async () => {

    // setBranch('')
    setModel('')
    setStock('')
  }

  // Loaner submission validation.
  const requestSubmitValidation = async (event) => {
    event.preventDefault()  

    const lowerCaseLetters = /[a-z]/g;
    const upperCaseLetters = /[A-Z]/g;
    if (model === '') {
        setValidationMessage("Transfer requests must have a model")
        setOpenError(true)
        return false
    } else if (stock.length !== 6 || stock.match(lowerCaseLetters) || stock.match(upperCaseLetters)) {
        setValidationMessage("Transfer requests must have a 6 digit stock number")
        setOpenError(true)
        return false
    } else {
        window.open(`mailto:${emails}?subject=Transfer?&body=Would ${model}, ST# ${stock} be available to transfer?`, "-blank")
        resetForm()
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
          Submit Transfer Request
        </Typography>
        <form className={classes.form} noValidate>
        
          <Grid container spacing={2}>

            {/* <Grid item xs={12}>
              <TextField
                size="small"
                variant="outlined"
                required
                fullWidth
                labelId="demo-simple-select-label"
                id="branch"
                className={classes.select}
                value={branch}
                label="Branch"
                onChange={e=> setBranch(e.target.value)}
                select
              >
                {branches.map(branch => (
                  <MenuItem value={branch}>{branch}</MenuItem>
                ))}
              </TextField>
            </Grid> */}
            
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
            <Button
                variant="contained"
                color="primary"
                endIcon={<SendRoundedIcon className={classes.submitIcon} />}
                className={classes.submit}
                onClick={requestSubmitValidation}
            >
                <p className={classes.submitIcon}>Submit Request</p>
            </Button>
          </Grid>
          
        </form>
      </Box>
    </Container>
  );
}