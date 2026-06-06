import React, { useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { useStateValue } from "../state-management/StateProvider";
import { auth, db } from "../services/firebase";
import { doc, setDoc } from "firebase/firestore";
import { updateEmail, updateProfile } from "firebase/auth";
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export default function ProfileView() {
  const history = useHistory();
  const [{ user, userProfile }, dispatch] = useStateValue();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openError, setOpenError] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) {
      history.push("/signIn");
      return;
    }

    setFirstName(userProfile?.firstName || "");
    setLastName(userProfile?.lastName || "");
    setEmail(userProfile?.email || user?.email || "");
    setPhone(userProfile?.phone || "");
  }, [history, user, userProfile]);

  const hasChanges = useMemo(() => {
    return (
      firstName !== (userProfile?.firstName || "") ||
      lastName !== (userProfile?.lastName || "") ||
      email !== (userProfile?.email || user?.email || "") ||
      phone !== (userProfile?.phone || "")
    );
  }, [email, firstName, lastName, phone, user, userProfile]);

  const closeSnackbars = () => {
    setOpenSuccess(false);
    setOpenError(false);
  };

  const saveProfile = async () => {
    if (!user) {
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setMessage("First and last name are required.");
      setOpenError(true);
      return;
    }

    if (!email.includes("@")) {
      setMessage("Enter a valid email address.");
      setOpenError(true);
      return;
    }

    setIsSaving(true);

    try {
      const nextFirstName = firstName.trim();
      const nextLastName = lastName.trim();
      const nextEmail = email.trim().toLowerCase();
      const nextPhone = phone.trim();

      if (auth.currentUser && auth.currentUser.email !== nextEmail) {
        await updateEmail(auth.currentUser, nextEmail);
      }

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: `${nextFirstName} ${nextLastName}`,
        });
      }

      const nextProfile = {
        id: user.uid,
        firstName: nextFirstName,
        lastName: nextLastName,
        email: nextEmail,
        phone: nextPhone,
        role: userProfile?.role || "",
        branch: userProfile?.branch || "",
      };

      await setDoc(doc(db, "users", user.uid), nextProfile, { merge: true });
      dispatch({ type: "SET_USER_PROFILE", userProfile: nextProfile });
      setMessage("Profile updated.");
      setOpenSuccess(true);
    } catch (error) {
      if (error?.code === "auth/requires-recent-login") {
        setMessage("Please sign out and sign back in, then retry updating email.");
      } else if (error?.code === "auth/email-already-in-use") {
        setMessage("That email is already in use by another account.");
      } else {
        setMessage("Unable to update profile. Please try again.");
      }
      setOpenError(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2, md: 4 } }}>
      <Card sx={{ p: { xs: 2, md: 3 }, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="h5" color="primary" sx={{ mb: 0.25 }}>
          Profile
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Update your account details.
        </Typography>

        <Stack spacing={1.25}>
          <TextField
            label="First Name"
            size="small"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            fullWidth
          />
          <TextField
            label="Last Name"
            size="small"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            fullWidth
          />
          <TextField
            label="Email"
            size="small"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            fullWidth
          />
          <TextField
            label="Phone Number"
            size="small"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            fullWidth
          />
          <TextField
            label="Branch"
            size="small"
            value={userProfile?.branch || ""}
            fullWidth
            disabled
          />
          <TextField
            label="Role"
            size="small"
            value={userProfile?.role || ""}
            fullWidth
            disabled
          />
        </Stack>

        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
          <Button variant="contained" onClick={saveProfile} disabled={!hasChanges || isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </Box>
      </Card>

      <Snackbar open={openSuccess} autoHideDuration={3200} onClose={closeSnackbars}>
        <Alert onClose={closeSnackbars} severity="success" sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
      <Snackbar open={openError} autoHideDuration={4200} onClose={closeSnackbars}>
        <Alert onClose={closeSnackbars} severity="error" sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
