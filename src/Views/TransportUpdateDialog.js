import React, { useState } from "react";
import { setDoc, doc } from "firebase/firestore";
import Button from "@mui/material/Button";
import Spinner from "..//components/Spinner";
import TextField from "@material-ui/core/TextField";
import Grid from "@material-ui/core/Grid";
import { Tooltip, Typography } from "@material-ui/core";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import moment from "moment";
import { db } from "../services/firebase";
import { sendTransportStatusEmail } from "../services/email-service";
import { Stack } from "@mui/material";

function TransportUpdateDialog(props) {
  const {
    request,
    handleCloseConfirmDialog,
    handleToggleConfirmDialog,
    isShowingConfirmDialog,
    fullName,
    userProfile,
    isShowingSpinner,
    setIsShowingSpinner,
  } = props;
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();

  // Handles updating the request status:
  const updateStatus = async () => {
    setIsShowingSpinner(true);
    var status = request.status;

    switch (status) {
      case "Requested":
        status = "Scheduled";
        break;

      case "Scheduled":
        status = "In Progress";
        break;

      case "In Progress":
        status = "Completed";
        break;

      default:
        status = "Completed";
    }

    const changeLogEntry = {
      user: fullName,
      change: `Status updated to ${status}`,
      timestamp: moment().format("DD-MMM-yyyy hh:mmA"),
    };

    request.changeLog.push(changeLogEntry);
    const requestRef = doc(
      db,
      "branches",
      userProfile.branch,
      "transport",
      request.id
    );

    await setDoc(
      requestRef,
      {
        status: status,
        statusTimestamp: moment().format("DD-MMM-yyyy h:mmA"),
        startDate: startDate,
        endDate: endDate,
        changeLog: request.changeLog,
      },
      {
        merge: true,
      }
    );

    // TODO update to transport email
    sendTransportStatusEmail(
      status,
      startDate,
      endDate,
      request,
      fullName,
      userProfile
    );

    handleCloseConfirmDialog();
    setTimeout(function () {
      setIsShowingSpinner(false);
    }, 1000);
  };

  const statusUpdateText = () => {
    if (request.status === "Requested") {
      return "Scheduled";
    } else if (request.status === "Scheduled") {
      return "In Progress";
    } else if (request.status === "In Progress") {
      return "Completed";
    } else {
      return "Requested";
    }
  };

  const disableButton = () => {
    if (request.status !== "Requested") return false;
    console.log("requested");
    if (startDate == undefined || startDate == null || startDate === "")
      return true;
    if (endDate == undefined || endDate == null || endDate === "") return true;
  };

  const handleStartDateInput = (e) => {
    if (e.target.value < moment().format()) return setStartDate("");
    return setStartDate(e.target.value);
  };

  const handleEndDateInput = (e) => {
    if (e.target.value < startDate) return setEndDate("");
    return setEndDate(e.target.value);
  };

  return (
    <>
        <Tooltip title="Update Status">
          <Button
            color="success"
            size="small"
            sx={{ width: "115px", pt: "5px" }}
            variant={
              request.status === "In Progress" ? "contained" : "outlined"
            }
            onClick={handleToggleConfirmDialog}
          >
            {request.status}
          </Button>
        </Tooltip>
        <p>
          <small>{request.statusTimestamp}</small>
        </p>

      <Dialog onClose={handleCloseConfirmDialog} open={isShowingConfirmDialog}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            margin: "5px 25px 25px 25px",
            maxWidth: "250px",
          }}
        >
          <DialogTitle>Confirm Update</DialogTitle>
          {isShowingSpinner ? (
            <div
              style={{
                justifyContent: "center",
                alignContent: "center",
                justifySelf: "center",
                alignSelf: "center",
              }}
            >
              <Typography>Saving</Typography>
              <Spinner frame={false} />
            </div>
          ) : (
            <div>
              <Typography>{`Update the request's status from`}</Typography>
              <Typography>{`\"${
                request.status
              }" to "${statusUpdateText()}"?`}</Typography>
              <Grid container spacing={2} style={{ marginTop: "10px" }}>
                {request.status === "Requested" ? (
                  <>
                    <Typography
                      variant="subtitle1"
                      style={{ fontWeight: "bold" }}
                    >
                      Delivery/pickup date and time window
                    </Typography>
                    <Grid item xs={12} sm={12}>
                      <TextField
                        key="startDate"
                        name="startDate"
                        variant="outlined"
                        type="datetime-local"
                        required
                        size="small"
                        id="startDate"
                        autoFocus
                        onChange={handleStartDateInput}
                        value={startDate}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        label="Start"
                      />
                    </Grid>
                    <Grid item xs={12} sm={12}>
                      <TextField
                        key="endDate"
                        name="endDate"
                        variant="outlined"
                        type="datetime-local"
                        required
                        size="small"
                        id="endDate"
                        onChange={handleEndDateInput}
                        value={endDate}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        label="End"
                      />
                    </Grid>
                  </>
                ) : null}
                <Grid item xs={6} sm={6}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleCloseConfirmDialog}
                  >
                    Cancel
                  </Button>
                </Grid>
                <Grid item xs={6} sm={6}>
                  <Button
                    variant="contained"
                    color="success"
                    disabled={disableButton()}
                    onClick={updateStatus}
                  >
                    Update
                  </Button>
                </Grid>
              </Grid>
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}

export default TransportUpdateDialog;
