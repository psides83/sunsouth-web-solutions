import React, { useEffect, useState } from 'react'
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
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import Snackbar from '@material-ui/core/Snackbar';
import { Alert } from '@mui/material';
import { useStateValue } from '../state-management/StateProvider';
import { auth, db } from '../services/firebase';
import { onSnapshot, doc } from 'firebase/firestore';

// #region Unused imports
// import MuiAlert from '@mui/material/Alert';
// import FormControlLabel from '@material-ui/core/FormControlLabel';
// import Checkbox from '@material-ui/core/Checkbox';
// import Link from '@material-ui/core/Link';
// #endregion


function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {'Copyright © '}
      <Link color="inherit" to="/">
        SunSouth Web Solutions
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

// const Alert = React.forwardRef(function Alert(props, ref) {
//   return <MuiAlert elevation={6} ref={ref} variant="outlined" {...props} />;
// });

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
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

export default function SignIn() {
  const classes = useStyles();
  const history = useHistory();
  const [{ user }, dispatch] = useStateValue();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [userProfile, setProfile] = useState({});
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openError, setOpenError] = useState(false);
  var [validationMessage, setValidationMessage] = useState('');

  const fetchProfile = async () => {
    try {
      onSnapshot(doc(db, "users", user?.uid), (doc) => {
        console.log("Current data: ", doc.data());
        setProfile(doc.data())
        dispatch({
          type: 'SET_USER_PROFILE',
          userProfile: doc.data(),
        })
    });
    } catch (error) {
      console.log('error', error)
    }

    
  }

  const signIn = e => {
      e.preventDefault();
      
      signInWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
      // Signed in 
      // const user = userCredential.user;
      fetchProfile()
      history.push("/");
      })
      .catch((error) => {
        setOpen(true);
        // const errorCode = error.code;
        // const errorMessage = error.message;
      });
  };

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

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };

  useEffect(() => {
    setLoading(false)
  }, [setLoading])

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.paper}>
        <img src="/ss-logo.png" alt="" className={classes.img}/>
        <Avatar className={classes.avatar}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <form className={classes.form} noValidate>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            size="small"
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email} 
            onChange={e=> setEmail(e.target.value)}
          />
          <TextField
            // className={classes.TextField}
            variant="outlined"
            margin="normal"
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
          <Snackbar open={open} autoHideDuration={3000} onClose={handleClose}>
            <Alert onClose={handleClose} severity="error" sx={{ width: '100%' }}>
              The email and password do not match
            </Alert>
          </Snackbar>

          <Snackbar open={openSuccess} autoHideDuration={3000} onClose={handleClose}>
            <Alert  onClose={handleClose} severity="success" sx={{ width: '100%' }}>
              {validationMessage}
            </Alert>
          </Snackbar>
          <Button 
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={classes.submit}
            onClick={signIn}
          >
            Sign In
          </Button>
          <Grid container>
            <Grid item xs>
              <Link onClick={forgotPassword} variant="body2">
                Forgot password?
              </Link>
            </Grid>
            <Grid item>
              <Link to="/signUp" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Grid>
          </Grid>
        </form>
      </div>
      <Box mt={8}>
        <Copyright />
      </Box>
    </Container>
  );
}