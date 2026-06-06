import React, { useState } from "react";
import { Link as RouterLink, useHistory } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "../services/firebase";
import { setDoc, doc } from "@firebase/firestore";
import { branches } from "../models/branches";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Container,
  Grid,
  Link,
  MenuItem,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { LockOutlined } from "@mui/icons-material";

export default function SignUp() {
  const history = useHistory();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [branch, setBranch] = useState("");
  const [role, setRole] = useState("");
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openError, setOpenError] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  const roles = ["admin", "sales", "service", "parts"];

  const register = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: `${firstName} ${lastName}` });

      const newUser = doc(db, "users", user.uid);
      const userData = {
        id: user.uid,
        firstName,
        lastName,
        email,
        phone,
        role,
        branch,
      };

      await setDoc(newUser, userData, { merge: true });
      setValidationMessage("Registration successful.");
      setOpenSuccess(true);
      history.push("/");
    } catch (error) {
      setValidationMessage("User already registered with this email address.");
      setOpenError(true);
    }
  };

  const signUpValidation = async (event) => {
    event.preventDefault();

    if (firstName === "") {
      setValidationMessage("First name is required to register.");
      setOpenError(true);
      return;
    }

    if (lastName === "") {
      setValidationMessage("Last name is required to register.");
      setOpenError(true);
      return;
    }

    if (branch === "") {
      setValidationMessage("User must select a branch to register.");
      setOpenError(true);
      return;
    }

    if (!email.includes("@sunsouth.com")) {
      setValidationMessage("User must register with a SunSouth company email.");
      setOpenError(true);
      return;
    }

    if (password.length < 8) {
      setValidationMessage("Password must be at least 8 characters.");
      setOpenError(true);
      return;
    }

    register();
  };

  const forgotPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      setValidationMessage("An email has been sent to reset your password.");
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

    setOpenSuccess(false);
    setOpenError(false);
  };

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
          <Avatar sx={{ mb: 1, bgcolor: "secondary.main", color: "secondary.contrastText" }}>
            <LockOutlined />
          </Avatar>
          <Typography component="h1" variant="h5" sx={{ mb: 0.5 }}>
            Sign up
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Create a branch-scoped account for SunSouth operations.
          </Typography>

          <Box component="form" sx={{ width: "100%" }} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  autoComplete="given-name"
                  name="firstName"
                  required
                  fullWidth
                  size="small"
                  id="firstName"
                  label="First Name"
                  autoFocus
                  onChange={(event) => setFirstName(event.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  size="small"
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                  onChange={(event) => setLastName(event.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  size="small"
                  required
                  fullWidth
                  id="role"
                  value={role}
                  label="Role"
                  onChange={(event) => setRole(event.target.value)}
                  select
                >
                  {roles.map((roleOption) => (
                    <MenuItem key={roleOption} value={roleOption}>
                      {roleOption}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={7}>
                <TextField
                  size="small"
                  required
                  fullWidth
                  id="branch"
                  value={branch}
                  label="Branch"
                  onChange={(event) => setBranch(event.target.value)}
                  select
                >
                  {branches.map((branchOption) => (
                    <MenuItem key={branchOption} value={branchOption}>
                      {branchOption}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  id="phone"
                  label="Phone Number (Optional)"
                  name="phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  size="small"
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  size="small"
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Grid>
            </Grid>

            <Snackbar open={openSuccess} autoHideDuration={3000} onClose={handleClose}>
              <Alert onClose={handleClose} severity="success" sx={{ width: "100%" }}>
                {validationMessage}
              </Alert>
            </Snackbar>

            <Snackbar open={openError} autoHideDuration={3000} onClose={handleClose}>
              <Alert onClose={handleClose} severity="error" sx={{ width: "100%" }}>
                {validationMessage}
              </Alert>
            </Snackbar>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 2, mb: 1.5, py: 1 }}
              onClick={signUpValidation}
            >
              Sign Up
            </Button>
            <Grid container justifyContent="space-between">
              <Grid item>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  underline="hover"
                  onClick={forgotPassword}
                >
                  Forgot password?
                </Link>
              </Grid>
              <Grid item>
                <Link component={RouterLink} to="/signIn" variant="body2" underline="hover">
                  Already have an account? Sign in
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
