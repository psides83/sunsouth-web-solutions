import React, { useState } from 'react'
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

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(3),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
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
      <Link color="inherit" href="https://mui.com/">
        SunSouth Web Solutions
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
};

class Request {
    constructor(id, timestamp, salesman, equipment, status, statusTimestamp, workOrder) {
      this.id = id
      this.timestamp = timestamp
      this.salesman = salesman
      this.equipment = equipment
      this.status = status
      this.statusTimestamp = statusTimestamp
      this.workOrder = workOrder
    };
  };

  class Equipment {
    constructor(model, stock, serial, work, notes) {
    this.model = model
    this.stock = stock 
    this.serial = serial 
    this.work = work
    this.notes = notes
    };
  };

export default function AddRequestView() {
  const classes = useStyles();
  const history = useHistory();
  const [{ user, userProfile }, dispatch] = useStateValue();
  const [model, setModel] = useState('');
  const [stock, setStock] = useState('');
  const [serial, setSerial] = useState('');
  const [work, setWork] = useState([]);
  const [notes, setNotes] = useState('');
  const [checked1, setChecked1] = React.useState(false);
  const [checked2, setChecked2] = React.useState(false);
  const [checked3, setChecked3] = React.useState(false);
  const [checked4, setChecked4] = React.useState(false);
  const [checked5, setChecked5] = React.useState(false);
  const [checked6, setChecked6] = React.useState(false);
  const [checked7, setChecked7] = React.useState(false);
  const [checked8, setChecked8] = React.useState(false);

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

      const filterEmpties = (job) => {
        return job !== ''
    }

      console.log(work.filter(filterEmpties).join())
  };



  const setEquipmentClass = (event) => {
    var equipment = new Equipment(model, stock, serial, work, notes)
  }

  const register = e => {
      e.preventDefault()

      
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.paper}>
        <Avatar className={classes.avatar}>
          <SendRoundedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Submit PDI/Setup Request
        </Typography>
        <form className={classes.form} noValidate>
            <Typography component="h1" variant="h6">
                First Equipment
            </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                autoComplete="fname"
                name="model"
                variant="outlined"
                required
                fullWidth
                id="model"
                label="Model"
                autoFocus
                onChange={e=> setModel(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                variant="outlined"
                required
                fullWidth
                id="stock"
                label="Stock"
                name="stock"
                onChange={e=> setStock(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  labelId="serial"
                  fullWidth
                  required
                  id="serial"
                //   className={classes.select}
                //   value={serial}
                  label="Serial"
                  onChange={e=> setSerial(e.target.value)}
                >
                </TextField>
            </Grid>
                <Grid item xs={12}>
                    <div className="checkBoxes">
                        <FormGroup>
                            <Typography variant="h6">Work Required</Typography>
                            <FormControlLabel control={<Checkbox id="1" checked={checked1} onChange={handleChange} color="primary" value="PDI"/>} label="PDI" />
                            <FormControlLabel control={<Checkbox id="2" checked={checked2} onChange={handleChange} color="primary" value="Water in tires"/>} label="Water in tires" />
                            <FormControlLabel control={<Checkbox id="3" checked={checked3} onChange={handleChange} color="primary" value="Mount to listed tractor/CCE machine"/>} label="Mount to listed tractor/CCE machine" />
                            <FormControlLabel control={<Checkbox id="4" checked={checked4} onChange={handleChange} color="primary" value="Add 3rd function"/>} label="Add 3rd function" />
                            <FormControlLabel control={<Checkbox id="5" checked={checked5} onChange={handleChange} color="primary" value="Install radio"/>} label="Install radio" />
                            <FormControlLabel control={<Checkbox id="6" checked={checked6} onChange={handleChange} color="primary" value="Mount canopy"/>} label="Mount canopy" />
                            <FormControlLabel control={<Checkbox id="7" checked={checked7} onChange={handleChange} color="primary" value="Widen tires"/>} label="Widen tires" />
                            <Stack direction="row">
                                <FormControlLabel control={<Checkbox />} label="Other:" />
                                <TextField
                                labelId="serial"
                                fullWidth
                                id="other"
                                //   className={classes.select}
                                //   value={serial}
                                onChange={e=> setNotes(e.target.value)}
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
                id="notes"
                label="Addtional Notes"
                name="notes"
                type="text"
                // value={notes} 
                onChange="{e=> setEmail(e.target.value)}"
              />
            </Grid>
          </Grid >
          <Grid container justifyContent="space-between">
            <Button
                type="submit"
                variant="outlined"
                color="primary"
                startIcon={<AddCircleOutlineIcon />}
                className={classes.submit}
                onClick={setEquipmentClass}
            >
                Add More Equipment
            </Button>
            <Button
                type="submit"
                variant="contained"
                color="primary"
                endIcon={<SendRoundedIcon />}
                className={classes.submit}
                onClick={register}
            >
                Submit
            </Button>
          </Grid>
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link to="/signUp" variant="body2">
                Already have an account? Sign in
              </Link>
            </Grid>
          </Grid>
        </form>
      </div>
      <Box mt={5}>
        <Copyright />
      </Box>
    </Container>
  );
}