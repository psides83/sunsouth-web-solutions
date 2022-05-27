import React, { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "../services/firebase";
import "../styles/SignUp.css";
import { setDoc, doc } from "@firebase/firestore";
import { branches } from "../models/branches";
import {
  Alert,
  Avatar,
  Button,
  Container,
  Grid,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { LockOutlined } from "@mui/icons-material";

// const useStyles = makeStyles((theme) => ({
//   paper: {
//     marginTop: theme.spacing(8),
//     display: 'flex',
//     flexDirection: 'column',
//     alignItems: 'center',
//   },
//   avatar: {
//     margin: theme.spacing(1),
//     backgroundColor: theme.palette.secondary.main,
//   },
//   form: {
//     width: '100%', // Fix IE 11 issue.
//     marginTop: theme.spacing(3),
//   },
//   submit: {
//     margin: theme.spacing(3, 0, 2),
//   },
// select: {

// },
// }));

export default function SignUp() {
  const history = useHistory();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [branch, setBranch] = useState("");
  const [role, setRole] = useState("");
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openError, setOpenError] = useState(false);
  var [validationMessage, setValidationMessage] = useState("");

  const roles = ["admin", "sales", "service", "parts"];

  const register = (e) => {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;

        updateProfile(user, { displayName: `${firstName} ${lastName}` });

        if (user) {
          const newUser = doc(db, "users", user.uid);
          const userData = {
            id: user.uid,
            firstName: firstName,
            lastName: lastName,
            email: email,
            role: role,
            branch: branch,
          };
          setValidationMessage("Registration successful.");
          setOpenSuccess(true);
          setDoc(newUser, userData, { merge: true });
          history.push("/");
        }
      })
      .catch((error) => {
        setValidationMessage(
          "User already registered with this email address."
        );
        setOpenError(true);
      });
  };

  // Squipment submission validation.
  const signUpValidation = async (event) => {
    event.preventDefault();

    if (firstName === "") {
      setValidationMessage("First name is required to register.");
      setOpenError(true);
      return;
    } else if (lastName === "") {
      setValidationMessage("Last name is required to register.");
      setOpenError(true);
      return;
    } else if (branch === "") {
      setValidationMessage("User must select a branch to register.");
      setOpenError(true);
      return;
    } else if (email.includes("@sunsouth.com") === false) {
      setValidationMessage("User must register with a SunSouth company email.");
      setOpenError(true);
      return;
    } else if (password.length < 8) {
      setValidationMessage("Password must be at least 8 characters.");
      setOpenError(true);
      return;
    } else {
      register();
    }
  };

  // Forgot password.
  const forgotPassword = async () => {
    await sendPasswordResetEmail(auth, email)
      .then(() => {
        // Password reset email sent!
        setValidationMessage("An email has been sent to reset your password");
        setOpenSuccess(true);
      })
      .catch((error) => {
        setValidationMessage("An email has been sent to reset your password");
        setOpenSuccess(true);
      });
  };

  // Handle closing of the alerts.
  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpenSuccess(false);
    setOpenError(false);
  };

  return (
    <Container component="main" maxWidth="xs">
      <div
        style={{
          marginTop: (theme) => theme.spacing(8),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Avatar
          sx={{
            margin: (theme) => theme.spacing(1),
            backgroundColor: (theme) => theme.palette.secondary.main,
          }}
        >
          <LockOutlined />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign up
        </Typography>
        <form
          style={{
            width: "100%", // Fix IE 11 issue.
            marginTop: (theme) => theme.spacing(1),
          }}
          noValidate
        >
          <Grid container spacing={2} sx={{marginTop: 1}}>
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
                onChange={(e) => setFirstName(e.target.value)}
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
                onChange={(e) => setLastName(e.target.value)}
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
                sx={{
                  "&:before": {
                    borderColor: (theme) => theme.palette.secondary.main,
                  },
                  "&:after": {
                    borderColor: (theme) => theme.palette.secondary.main,
                  },
                  "&:not(.Mui-disabled):hover::before": {
                    borderColor: (theme) => theme.palette.secondary.main,
                  },
                }}
                value={role}
                label="Role"
                onChange={(e) => setRole(e.target.value)}
                select
              >
                {roles.map((role) => (
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
                sx={{
                  "&:before": {
                    borderColor: (theme) => theme.palette.secondary.main,
                  },
                  "&:after": {
                    borderColor: (theme) => theme.palette.secondary.main,
                  },
                  "&:not(.Mui-disabled):hover::before": {
                    borderColor: (theme) => theme.palette.secondary.main,
                  },
                }}
                value={branch}
                label="Branch"
                onChange={(e) => setBranch(e.target.value)}
                select
              >
                {branches.map((branch) => (
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
                onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
              />
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
            <Alert
              onClose={handleClose}
              severity="error"
              sx={{ width: "100%" }}
            >
              {validationMessage}
            </Alert>
          </Snackbar>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            style={{marginTop: "10px"}}
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
    </Container>
  );
}
