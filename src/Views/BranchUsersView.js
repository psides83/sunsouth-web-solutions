import React, { useEffect, useMemo, useState } from "react";
import { useStateValue } from "../state-management/StateProvider";
import { collection, doc, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { createUserWithEmailAndPassword, getAuth, signOut, updateProfile } from "firebase/auth";
import { getApp, getApps, initializeApp } from "firebase/app";
import { db, firebaseConfig } from "../services/firebase";
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { AddRounded } from "@mui/icons-material";

const ROLE_OPTIONS = ["admin", "sales", "service", "parts", "driver"];
const SECONDARY_ADMIN_APP_NAME = "adminUserCreation";

const createEmptyUserForm = (branch = "") => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "sales",
  branch,
  password: "",
});

export default function BranchUsersView() {
  const [{ userProfile }] = useStateValue();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [creatingUser, setCreatingUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openError, setOpenError] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!userProfile?.branch) {
      setUsers([]);
      setLoading(false);
      return undefined;
    }

    const usersQuery = query(
      collection(db, "users"),
      where("branch", "==", userProfile.branch),
    );

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        setUsers(
          snapshot.docs.map((userDoc) => ({
            id: userDoc.id,
            ...userDoc.data(),
          })),
        );
        setLoading(false);
      },
      () => {
        setUsers([]);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [userProfile?.branch]);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const aName = `${a.firstName || ""} ${a.lastName || ""}`.trim().toLowerCase();
      const bName = `${b.firstName || ""} ${b.lastName || ""}`.trim().toLowerCase();
      return aName.localeCompare(bName);
    });
  }, [users]);

  const closeSnackbars = () => {
    setOpenSuccess(false);
    setOpenError(false);
  };

  const openEditor = (userRecord) => {
    setEditingUser({
      id: userRecord.id,
      firstName: userRecord.firstName || "",
      lastName: userRecord.lastName || "",
      email: userRecord.email || "",
      phone: userRecord.phone || "",
      role: userRecord.role || "sales",
      branch: userRecord.branch || userProfile?.branch || "",
    });
  };

  const closeEditor = () => {
    setEditingUser(null);
  };

  const openCreator = () => {
    setCreatingUser(createEmptyUserForm(userProfile?.branch || ""));
  };

  const closeCreator = () => {
    setCreatingUser(null);
  };

  const handleEditingField = (field, value) => {
    setEditingUser((previous) => ({ ...previous, [field]: value }));
  };

  const handleCreatingField = (field, value) => {
    setCreatingUser((previous) => ({ ...previous, [field]: value }));
  };

  const validateUserForm = (userForm, { requirePassword = false } = {}) => {
    if (!userForm.firstName.trim() || !userForm.lastName.trim()) {
      setMessage("First and last name are required.");
      setOpenError(true);
      return false;
    }

    if (!String(userForm.email || "").includes("@")) {
      setMessage("Enter a valid email address.");
      setOpenError(true);
      return false;
    }

    if (requirePassword && String(userForm.password || "").length < 8) {
      setMessage("Password must be at least 8 characters.");
      setOpenError(true);
      return false;
    }

    return true;
  };

  const saveUser = async () => {
    if (!editingUser?.id) {
      return;
    }

    if (!validateUserForm(editingUser)) {
      return;
    }

    setIsSaving(true);
    try {
      await setDoc(
        doc(db, "users", editingUser.id),
        {
          firstName: editingUser.firstName.trim(),
          lastName: editingUser.lastName.trim(),
          email: editingUser.email.trim().toLowerCase(),
          phone: editingUser.phone.trim(),
          role: editingUser.role,
          branch: editingUser.branch || userProfile?.branch || "",
        },
        { merge: true },
      );

      setMessage("User updated.");
      setOpenSuccess(true);
      closeEditor();
    } catch (error) {
      setMessage("Unable to save user changes.");
      setOpenError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const createUser = async () => {
    if (!creatingUser || !validateUserForm(creatingUser, { requirePassword: true })) {
      return;
    }

    setIsSaving(true);
    const secondaryApp = getApps().some((app) => app.name === SECONDARY_ADMIN_APP_NAME)
      ? getApp(SECONDARY_ADMIN_APP_NAME)
      : initializeApp(firebaseConfig, SECONDARY_ADMIN_APP_NAME);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const credential = await createUserWithEmailAndPassword(
        secondaryAuth,
        creatingUser.email.trim().toLowerCase(),
        creatingUser.password,
      );

      await updateProfile(credential.user, {
        displayName: `${creatingUser.firstName.trim()} ${creatingUser.lastName.trim()}`,
      });

      await setDoc(
        doc(db, "users", credential.user.uid),
        {
          id: credential.user.uid,
          firstName: creatingUser.firstName.trim(),
          lastName: creatingUser.lastName.trim(),
          email: creatingUser.email.trim().toLowerCase(),
          phone: creatingUser.phone.trim(),
          role: creatingUser.role,
          branch: userProfile?.branch || creatingUser.branch || "",
        },
        { merge: true },
      );

      await signOut(secondaryAuth);
      setMessage("User created.");
      setOpenSuccess(true);
      closeCreator();
    } catch (error) {
      if (error?.code === "auth/email-already-in-use") {
        setMessage("That email is already in use.");
      } else {
        setMessage("Unable to create user.");
      }
      setOpenError(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (userProfile?.role !== "admin") {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
        <Card sx={{ p: 2.5, border: "1px solid", borderColor: "divider" }}>
          <Typography variant="h6" color="error">
            Access denied
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Admin role is required to view branch users.
          </Typography>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Card sx={{ p: { xs: 1.5, md: 2.25 }, border: "1px solid", borderColor: "divider" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "flex-start" }}
          sx={{ mb: 1.25 }}
        >
          <Box>
            <Typography variant="h5" color="primary" sx={{ fontSize: { xs: 22, sm: 26 } }}>
              Branch Users
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage users for branch {userProfile?.branch || "-"}.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddRounded />} onClick={openCreator}>
            Create User
          </Button>
        </Stack>

        <TableContainer component={Paper} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
          <Table size="small" sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="body2" color="text.secondary">
                      Loading users...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : sortedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="body2" color="text.secondary">
                      No users found for this branch.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedUsers.map((userRecord) => (
                  <TableRow key={userRecord.id}>
                    <TableCell>{`${userRecord.firstName || ""} ${userRecord.lastName || ""}`.trim() || "-"}</TableCell>
                    <TableCell>{userRecord.email || "-"}</TableCell>
                    <TableCell>{userRecord.phone || "-"}</TableCell>
                    <TableCell>{userRecord.role || "-"}</TableCell>
                    <TableCell>{userRecord.branch || "-"}</TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" onClick={() => openEditor(userRecord)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
          Editing email here updates the profile record. Existing users must update login email from their Profile page.
        </Typography>
      </Card>

      <Dialog open={Boolean(editingUser)} onClose={closeEditor} fullWidth maxWidth="sm">
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {editingUser ? (
            <Stack spacing={1.1} sx={{ mt: 0.25 }}>
              <TextField
                size="small"
                label="First Name"
                value={editingUser.firstName}
                onChange={(event) => handleEditingField("firstName", event.target.value)}
                fullWidth
              />
              <TextField
                size="small"
                label="Last Name"
                value={editingUser.lastName}
                onChange={(event) => handleEditingField("lastName", event.target.value)}
                fullWidth
              />
              <TextField
                size="small"
                label="Email"
                type="email"
                value={editingUser.email}
                onChange={(event) => handleEditingField("email", event.target.value)}
                fullWidth
              />
              <TextField
                size="small"
                label="Phone"
                value={editingUser.phone}
                onChange={(event) => handleEditingField("phone", event.target.value)}
                fullWidth
              />
              <TextField
                size="small"
                select
                label="Role"
                value={editingUser.role}
                onChange={(event) => handleEditingField("role", event.target.value)}
                fullWidth
              >
                {ROLE_OPTIONS.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </TextField>
              <TextField size="small" label="Branch" value={editingUser.branch} disabled fullWidth />
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditor}>Cancel</Button>
          <Button variant="contained" onClick={saveUser} disabled={isSaving}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(creatingUser)} onClose={closeCreator} fullWidth maxWidth="sm">
        <DialogTitle>Create User</DialogTitle>
        <DialogContent>
          {creatingUser ? (
            <Stack spacing={1.1} sx={{ mt: 0.25 }}>
              <TextField
                size="small"
                label="First Name"
                value={creatingUser.firstName}
                onChange={(event) => handleCreatingField("firstName", event.target.value)}
                fullWidth
              />
              <TextField
                size="small"
                label="Last Name"
                value={creatingUser.lastName}
                onChange={(event) => handleCreatingField("lastName", event.target.value)}
                fullWidth
              />
              <TextField
                size="small"
                label="Email"
                type="email"
                value={creatingUser.email}
                onChange={(event) => handleCreatingField("email", event.target.value)}
                fullWidth
              />
              <TextField
                size="small"
                label="Temporary Password"
                type="password"
                value={creatingUser.password}
                onChange={(event) => handleCreatingField("password", event.target.value)}
                fullWidth
              />
              <TextField
                size="small"
                label="Phone"
                value={creatingUser.phone}
                onChange={(event) => handleCreatingField("phone", event.target.value)}
                fullWidth
              />
              <TextField
                size="small"
                select
                label="Role"
                value={creatingUser.role}
                onChange={(event) => handleCreatingField("role", event.target.value)}
                fullWidth
              >
                {ROLE_OPTIONS.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </TextField>
              <TextField size="small" label="Branch" value={creatingUser.branch} disabled fullWidth />
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCreator}>Cancel</Button>
          <Button variant="contained" onClick={createUser} disabled={isSaving}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={openSuccess} autoHideDuration={2800} onClose={closeSnackbars}>
        <Alert onClose={closeSnackbars} severity="success" sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
      <Snackbar open={openError} autoHideDuration={3600} onClose={closeSnackbars}>
        <Alert onClose={closeSnackbars} severity="error" sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
