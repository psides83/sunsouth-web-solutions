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
  const [{ userProfile }] = useStateValue();
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
  var [eqString, setEqString] = useState([]);
  console.log(equipmentList)

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

const enableOther = (event) => {
  setOther(event.target.value)

  if (event.target.value !== '') {
    setOtherState(false)
  } else if (event.target.value === '') {
    setOtherState(true)
  }
}

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

  const setRequestToFirestore = async (event) => {
    event.preventDefault()  
    const timestamp = moment().format("MMM-DD-yyyy hh:mmA")
    const id = moment().format("MMDDyyyyhh:mmA")
    const salesman = userProfile?.firstName + ' ' + userProfile?.lastName

    await pushEquipmentToRequest(event)

    const firestoreRequest = {
      id: id,
      timestamp: timestamp,
      salesman: salesman,
      equipment: equipmentList,
      status: "Requested",
      statusTimestamp: "",
      workOrder: ""
    }

    const requestRef = doc(db, 'branches',  userProfile.branch, 'requests', firestoreRequest.id);

    await setDoc(requestRef, firestoreRequest, { merge: true });
  } 

  const resetForm = async () => {
    console.log("request updated")
    setModel("")
    console.log("model cleared")
    setStock("")
    console.log("stock cleared")
    setSerial("")
    console.log("serial cleared")
    setNotes("")
    setOther("")
    setChecked1(false)
    console.log(checked1)
    setChecked2(false)
    setChecked3(false)
    setChecked4(false)
    setChecked5(false)
    setChecked6(false)
    setChecked7(false)
    setChecked8(false)
    setWork([])
  }

  const pushEquipmentToRequest = async (event) => {
    event.preventDefault()  
    var workString = work.toString().replace(/,[s]*/g, ", ")
    
    if (workString[0] == ',') {
      workString = workString.substring(1).trim()
    }

    var equipment = {
      id: equipmentList.length + 1,
      model: model,
      stock: stock,
      serial: serial,
      work: workString,
      notes: notes
    }

    
    eqString.push(equipment.model)
    console.log(eqString)

    equipmentList.push(equipment)
    setEquepmentList(equipmentList)
    console.log("Temp EQ")
    console.log(equipmentList)
    
    await resetForm()
  }

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box className={classes.paper}>
        <Avatar className={classes.avatar}>
          <SendRoundedIcon className={classes.icon} />
        </Avatar>
        <Typography component="h1" variant="h5">
          Submit PDI/Setup Request
        </Typography>

{/* Form */}
      {
        request.equipment?.map((item) => (

          <form className={classes.form} noValidate>
            <Stack mb={1}>
              <Typography component="h1" variant="h6">
                  Equipment
              </Typography>
              <Stack spacing={1} direction="row">
                
                <Typography variant="body">
                  {eqString.toString().replace(/,[s]*/g, ", ")}
                </Typography>
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