import React, { useState } from 'react'
import { Link, useHistory } from 'react-router-dom';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from '../services/firebase';
import '../styles/SignUp.css'
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import { setDoc, doc } from '@firebase/firestore';
import Snackbar from '@material-ui/core/Snackbar';
import { Alert } from '@mui/material';
import { branches } from '../components/branches';

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
        Your Website
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
};

export default function SignUp() {
  const classes = useStyles();
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [branch, setBranch] = useState('');
  const [role, setRole] = useState('');
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openError, setOpenError] = useState(false);
  var [validationMessage, setValidationMessage] = useState('');

  const roles = ['admin', 'sales', 'service', 'parts']

  const register = (e) => {

      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          // Signed in 
          const user = userCredential.user;

          if(user) {
            const newUser = doc(db, "users", user.uid);
            const userData = {
              id: user.uid,
              firstName: firstName,
              lastName: lastName,
              email: email,
              role: role,
              branch: branch
            }
            setValidationMessage("Registration successful.")
            setOpenSuccess(true)
            setDoc(newUser, userData, { merge: true });
            history.push("/");
          }
        })
        .catch((error) => {

          setValidationMessage("User already registered with this email address.")
          setOpenError(true)
        });
  };

    // Squipment submission validation.
    const signUpValidation = async (event) => {
      event.preventDefault()  
  
      if (firstName === '') {

        setValidationMessage("First name is required to register.")
        setOpenError(true)
        return
      } else if (lastName === '') {

        setValidationMessage("Last name is required to register.")
        setOpenError(true)
        return
      } else if (branch === '') {

        setValidationMessage("User must select a branch to register.")
        setOpenError(true)
        return
      } else if (email.includes('@sunsouth.com') === false) {

        setValidationMessage("User must register with a SunSouth company email.")
        setOpenError(true)
        return
      } else if (password.length < 8) {

        setValidationMessage("Password must be at least 8 characters.")
        setOpenError(true)
        return
      } else {
        register()
      }
    }

    // Forgot password.
    const forgotPassword = async () => {

      await sendPasswordResetEmail(auth, email)
              .then(() => {
                // Password reset email sent!
                setValidationMessage("An email has been sent to reset your password")
                setOpenSuccess(true)
              })
              .catch((error) => {
                
                setValidationMessage("An email has been sent to reset your password")
                setOpenSuccess(true)
              });
      }

    

    // Handle closing of the alerts.
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpenSuccess(false);
    setOpenError(false);
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.paper}>
        <Avatar className={classes.avatar}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign up
        </Typography>
        <form className={classes.form} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                autoComplete="fname"
                name="firstName"
                variant="outlined"
                required
                fullWidth
                size="small"
                id="firstName"
                label="First Name"
                autoFocus
                onChange={e=> setFirstName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                variant="outlined"
                required
                fullWidth
                size="small"
                id="lastName"
                label="Last Name"
                name="lastName"
                autoComplete="lname"
                onChange={e=> setLastName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                  size="small"
                  variant="outlined"
                  required
                  fullWidth
                  labelId="demo-simple-select-label"
                  id="role"
                  className={classes.select}
                  value={role}
                  label="Role"
                  onChange={e=> setRole(e.target.value)}
                  select
                >
                  {roles.map(role => (
                    <MenuItem value={role}>{role}</MenuItem>
                  ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={7}>
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
            </Grid>

            <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                size="small"
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                type="text"
                value={email} 
                onChange={e=> setEmail(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                size="small"
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password} 
                onChange={e=> setPassword(e.target.value)}
              />
            </Grid>
          </Grid>

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

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={classes.submit}
            onClick={signUpValidation}
          >
            Sign Up
          </Button>
          <Grid container justifyContent="space-between">
            <Grid item>
              <Link onClick={forgotPassword} variant="body2">
               Forgot password?
              </Link>  
            </Grid>
            <Grid item>
              <Link to="/signIn" variant="body2">
                Already have an account? Sign in
              </Link>
            </Grid>
          </Grid>
        </form>
      </div>
      {/* <Box mt={5}>
        <Copyright />
      </Box> */}
    </Container>
  );
}