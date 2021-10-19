import React, { useState, useEffect } from 'react'
import { Link, useHistory } from 'react-router-dom';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
// import Link from '@material-ui/core/Link';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from './firebase';
import './SignUp.css'
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { setDoc, doc } from '@firebase/firestore';
import OutlinedInput from '@mui/material/OutlinedInput';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { FormGroup } from '@material-ui/core';
import { Stack } from '@mui/material';
import './AddRequest.css'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useStateValue } from './StateProvider';
import moment from 'moment';


const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.primary.main,
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

export default function EditRequestView() {  
  const classes = useStyles();
  const history = useHistory();
  const [{ userProfile, activeRequest }] = useStateValue();
  var [model, setModel] = useState('');
  var [stock, setStock] = useState('');
  var [serial, setSerial] = useState('');
  var [work, setWork] = useState([]);
  var [notes, setNotes] = useState('');
  
  const request = {
    equipment: [{
      model: "3025E",
      stock: "302564",
      serial: "1RW8370DAMB187039",
      work: "",
      notes:''
    },
    {
      model: "3038E",
      stock: "302564",
      serial: "1RW8370DAMB187039",
      work: "",
      notes:''
    },]
  }

  const setRequestToFirestore = async (event) => {
    event.preventDefault()  
    
    const salesman = userProfile?.firstName + ' ' + userProfile?.lastName

    const firestoreRequest = {
      salesman: salesman,
      equipment: request.equipment,
      workOrder: ""
    }

    const requestRef = doc(db, 'branches',  userProfile.branch, 'requests', firestoreRequest.id);

    await setDoc(requestRef, firestoreRequest, { merge: true });
  } 

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box className={classes.paper}>
        <Avatar className={classes.avatar}>
          <SendRoundedIcon className={classes.icon} />
        </Avatar>
        <Typography component="h1" variant="h5">
          Edit PDI/Setup Request
        </Typography>

{/* Form */}
      {
        activeRequest.equipment?.map((item) => (

          <form className={classes.form} noValidate>
            <Stack mb={1}>
              <Typography component="h1" variant="h6">
                  Equipment
              </Typography>
              <Stack spacing={1} direction="row">
                
              </Stack>
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
                  // onChange={e=> setModel(e.target.value)}
                  value={item.model}
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
                  // onChange={e=> setStock(e.target.value)}
                  value={item.stock}
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
                    // onChange={e=> setSerial(e.target.value)}
                    value={item.serial}
                  >
                  </TextField>
              </Grid>
              <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    labelId="serial"
                    fullWidth
                    size="small"
                    required
                    id="serial"
                    label="Work Required"
                    // onChange={e=> setSerial(e.target.value)}
                    value={item.work}
                  >
                  </TextField>
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
                  value={item.notes} 
                  // onChange="{e=> setEmail(e.target.value)}"
                />
              </Grid>
            </Grid >
            </form>
            ))
          }
            <Grid container justifyContent="flex-end">
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

      </Box>
      <Box mt={5}>
        <Copyright />
      </Box>
    </Container>
  );
}