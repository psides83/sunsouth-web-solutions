import React, { useEffect, useState } from "react";
import { Link as RouterLink, useHistory } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useStateValue } from "../state-management/StateProvider";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Container,
  Grid,
  Link,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { LockOutlined } from "@mui/icons-material";

function Copyright() {
  return (
    <Typography variant="body2" color="text.secondary" align="center">
      {"Copyright © "}
      <Link component={RouterLink} color="inherit" to="/">
        SunSouth Web Solutions
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}

export default function SignIn() {
  const history = useHistory();
  const [, dispatch] = useStateValue();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openError, setOpenError] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  const signIn = async (event) => {
    event.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const profileSnapshot = await getDoc(doc(db, "users", userCredential.user.uid));
      const profile = profileSnapshot.data() || {};

      dispatch({
        type: "SET_USER_PROFILE",
        userProfile: profile,
      });

      if (profile.role === "driver") {
        history.push("/transport-manager");
      } else {
        history.push("/");
      }
    } catch (error) {
      setValidationMessage("The email and/or password do not match");
      setOpenError(true);
    }
  };

  const forgotPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      setValidationMessage("Password reset email sent.");
      setOpenSuccess(true);
    } catch (error) {
      setValidationMessage("Enter your account email, then try reset again.");
      setOpenError(true);
    }
  };

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpenError(false);
    setOpenSuccess(false);
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return null;
  }

  return (
    <Container component="main" maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          border: "1px solid",
          borderColor: "rgba(47, 125, 49, 0.18)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(247,250,247,0.95) 100%)",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Box
            component="img"
            src="/ss-logo.png"
            alt="SunSouth"
            sx={{ width: { xs: 132, md: 168 }, mb: 1 }}
          />
          <Avatar sx={{ mb: 1, bgcolor: "secondary.main", color: "secondary.contrastText" }}>
            <LockOutlined />
          </Avatar>
          <Typography component="h1" variant="h5" sx={{ mb: 0.5 }}>
            Sign in
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Manage setup requests, transport, and loaners.
          </Typography>

          <Box component="form" sx={{ width: "100%" }} noValidate>
            <TextField
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
              onChange={(event) => setEmail(event.target.value)}
            />
            <TextField
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
              onChange={(event) => setPassword(event.target.value)}
            />

            <Snackbar open={openError} autoHideDuration={3000} onClose={handleClose}>
              <Alert onClose={handleClose} severity="error" sx={{ width: "100%" }}>
                {validationMessage}
              </Alert>
            </Snackbar>

            <Snackbar open={openSuccess} autoHideDuration={3000} onClose={handleClose}>
              <Alert onClose={handleClose} severity="success" sx={{ width: "100%" }}>
                {validationMessage}
              </Alert>
            </Snackbar>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 2, mb: 1.5, py: 1 }}
              onClick={signIn}
            >
              Sign In
            </Button>

            <Grid container>
              <Grid item xs>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={forgotPassword}
                  underline="hover"
                >
                  Forgot password?
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Paper>
      <Box sx={{ mt: 3 }}>
        <Copyright />
      </Box>
    </Container>
  );
}
