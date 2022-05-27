//Imports
import React, { useState } from "react";
import "../styles/SignUp.css";
import "../styles/AddRequest.css";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Container,
  Grid,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { AgricultureRounded, SendRounded } from "@mui/icons-material";
// import { styled } from '@mui/material/styles';

// Sets useStyles for customizing Material UI components.
// const useStyles = makeStyles((theme) => ({
//   paper: {
//   },
//   avatar: {
//     width: 64,
//     height: 64,
//     margin: theme.spacing(1),
//     backgroundColor: theme.palette.primary.main,
//   },
//   img: {
//     padding: 1
//   },
//   icon: {
//     color: theme.palette.secondary.main,
//   },
//   title: {
//     color: theme.palette.primary.main,
//   },
//   form: {
//     width: '100%', // Fix IE 11 issue.
//     marginTop: theme.spacing(3),
//   },
//   addEquipment: {
//     margin: theme.spacing(3, 0, 2),
//   },
//   submit: {
//     margin: theme.spacing(3, 0, 2),
//   },
//   submitIcon: {
//     color: theme.palette.secondary.main,
//   },
//   select: {
//     '&:before': {
//         borderColor: theme.palette.secondary.main,
//     },
//     '&:after': {
//         borderColor: theme.palette.secondary.main,
//     },
//     '&:not(.Mui-disabled):hover::before': {
//         borderColor: theme.palette.secondary.main,
//     },
//   },
// }));

export default function TransferRequestView({ emails }) {
  //#region State Properties
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openError, setOpenError] = useState(false);
  var [model, setModel] = useState("");
  var [stock, setStock] = useState("");
  var [validationMessage, setValidationMessage] = useState("");
  //#endregion

  // Handle closing of the alerts.
  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpenSuccess(false);
    setOpenError(false);
  };

  // Reset the form
  const resetForm = async () => {
    // setBranch('')
    setModel("");
    setStock("");
  };

  // Loaner submission validation.
  const requestSubmitValidation = async (event) => {
    event.preventDefault();

    const lowerCaseLetters = /[a-z]/g;
    const upperCaseLetters = /[A-Z]/g;
    if (model === "") {
      setValidationMessage("Transfer requests must have a model");
      setOpenError(true);
      return false;
    } else if (
      stock.length !== 6 ||
      stock.match(lowerCaseLetters) ||
      stock.match(upperCaseLetters)
    ) {
      setValidationMessage(
        "Transfer requests must have a 6 digit stock number"
      );
      setOpenError(true);
      return false;
    } else {
      window.open(
        `mailto:${emails}?subject=Transfer?&body=Would ${model}, ST# ${stock} be available to transfer?`,
        "-blank"
      );
      resetForm();
    }
  };

  // UI view of the submission form
  return (
    <Container component="main" maxWidth="xs">
      <Box
        style={{
          marginTop: (theme) => theme.spacing(4),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Avatar
          sx={{
            width: 64,
            height: 64,
            margin: (theme) => theme.spacing(1),
            backgroundColor: (theme) => theme.palette.primary.main,
          }}
        >
          <AgricultureRounded color="secondary" fontSize="large" />
        </Avatar>
        <Typography
          component="h1"
          variant="h"
          style={{ width: "100%", marginTop: (theme) => theme.spacing(3) }}
        >
          Submit Transfer Request
        </Typography>
        <form className={classes.form} noValidate>
          <Grid container spacing={2}>
            {/* <Grid item xs={12}>
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
            </Grid> */}

            <Grid item xs={12} sm={6}>
              <TextField
                name="model"
                variant="outlined"
                required
                fullWidth
                size="small"
                id="model"
                label="Model"
                labelId="model"
                onChange={(e) => setModel(e.target.value.toUpperCase())}
                value={model}
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
                labelId="stock"
                name="stock"
                onChange={(e) => setStock(e.target.value)}
                value={stock}
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

          <Grid container justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              endIcon={<SendRounded className={classes.submitIcon} />}
              className={classes.submit}
              onClick={requestSubmitValidation}
            >
              <p className={classes.submitIcon}>Submit Request</p>
            </Button>
          </Grid>
        </form>
      </Box>
    </Container>
  );
}
