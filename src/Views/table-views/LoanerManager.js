import React, { useCallback, useEffect, useState } from "react";
import { useStateValue } from "../../state-management/StateProvider";
import {
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import moment from "moment";
import HomeSkeleton from "../../components/HomeSkeleton";
import "../../styles/LoanerManager.css";
import AddLoanerView from "../AddLoanerView";
import { sendLoanerStatusEmail } from "../../services/email-service";
import Spinner from "../../components/Spinner";
import {
  Box,
  Button,
  Card,
  Container,
  Dialog,
  DialogTitle,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { AddRounded } from "@mui/icons-material";

// Loaner row view:
function Row({ loaner }) {
  // #region State Properties
  const [{ userProfile }] = useStateValue();
  const [isShowingConfirmDialog, setIsShowingConfirmDialog] = useState(false);
  const [isShowingSpinner, setIsShowingSpinner] = useState(false);
  const fullName = `${userProfile?.firstName} ${userProfile?.lastName}`;
  // #endregion

  const handleCloseConfirmDialog = () => {
    setIsShowingConfirmDialog(false);
  };

  const handleToggleConfirmDialog = () => {
    setIsShowingConfirmDialog(!isShowingConfirmDialog);
  };

  // Handles updating the request status:
  const updateStatus = async () => {
    setIsShowingSpinner(true);
    var status = loaner.status;

    switch (status) {
      case "Out":
        status = "Returned";
        break;
      default:
        status = "Returned";
    }

    const changeLogEntry = {
      user: fullName,
      change: `Status updated to ${status}`,
      timestamp: moment().format("DD-MMM-yyyy hh:mmA"),
    };

    loaner.changeLog.push(changeLogEntry);

    const loanerRef = doc(
      db,
      "branches",
      userProfile.branch,
      "loaners",
      loaner.id
    );

    await setDoc(
      loanerRef,
      {
        status: status,
        statusTimestamp: moment().format("DD-MMM-yyyy"),
        changeLog: loaner.changeLog,
      },
      { merge: true }
    );

    sendLoanerStatusEmail(loaner, fullName, userProfile);
    handleCloseConfirmDialog();
    setTimeout(function () {
      setIsShowingSpinner(false);
    }, 1000);
  };

  const statusUpdateText = () => {
    if (loaner.status === "Out") {
      return "Returned";
    } else {
      return "Out";
    }
  };

  // Request row UI:
  return (
    <React.Fragment>
      <TableRow key={loaner.id} sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell key={loaner.employee} component="th" scope="row">
          <p>{loaner.employee}</p>
          <small>{loaner.timestamp}</small>
        </TableCell>

        <TableCell key={loaner.model} align="left">
          {loaner.model}
        </TableCell>

        <TableCell key={loaner.stock} component="th" scope="row">
          <p>{`Stock: ${loaner.stock}`}</p>
          <small>{`Serial: ${loaner.serial}`}</small>
        </TableCell>

        <TableCell key={loaner.hours} align="left">
          {loaner.hours}
        </TableCell>

        <TableCell key={loaner.customer} align="left">
          {loaner.customer}
        </TableCell>

        <TableCell key={loaner.status} align="left">
          <Button size="small" variant="outlined" onClick={handleToggleConfirmDialog}>
            {loaner.status}
          </Button>
          <p>
            <small>{loaner.statusTimestamp}</small>
          </p>

          <Dialog
            onClose={handleCloseConfirmDialog}
            open={isShowingConfirmDialog}
            fullWidth
            maxWidth="xs"
          >
            <Box sx={{ p: 2.5 }}>
              <DialogTitle sx={{ px: 0, pt: 0, pb: 1.25 }}>Confirm Update</DialogTitle>
              {isShowingSpinner ? (
                <Box sx={{ display: "grid", placeItems: "center", py: 1 }}>
                  <Typography>Saving</Typography>
                  <Spinner frame={false} />
                </Box>
              ) : (
                <Box>
                  <Typography>{`Update the loaner's status from`}</Typography>
                  <Typography sx={{ mt: 0.25 }}>{`"${loaner.status}" to "${statusUpdateText()}"?`}</Typography>
                  <Stack direction="row" justifyContent="space-between" sx={{ mt: 2.25 }}>
                    <Button variant="outlined" color="error" onClick={handleCloseConfirmDialog}>
                      Cancel
                    </Button>
                    <Button variant="contained" onClick={updateStatus}>
                      Update
                    </Button>
                  </Stack>
                </Box>
              )}
            </Box>
          </Dialog>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

// Whole table view:
export default function LoanerManager() {
  // #region State Properties
  const [{ userProfile }] = useStateValue();
  const [loaners, setLoaners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddLoanerView, setOpenAddLoanerView] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  // #endregion

  const handleCloseAddLoanerView = () => {
    setOpenAddLoanerView(false);
  };
  const handleToggleAddLoanerView = () => {
    setOpenAddLoanerView(!openAddLoanerView);
  };

  // Fetch loanerss from firestore:
  const fetch = useCallback(async () => {
    console.log(userProfile?.branch);
    if (userProfile) {
      const loanersQuery = query(
        collection(db, "branches", userProfile?.branch, "loaners"),
        where("status", "!=", "Returned")
      );

      await onSnapshot(loanersQuery, (querySnapshot) => {
        setLoaners(
          querySnapshot.docs.map((doc) => ({
            id: doc.data().id,
            dateOut: doc.data().dateOut,
            employee: doc.data().employee,
            timestamp: doc.data().timestamp,
            model: doc.data().model,
            stock: doc.data().stock,
            serial: doc.data().serial,
            hours: doc.data().hours,
            customer: doc.data().customer,
            status: doc.data().status,
            statusTimestamp: doc.data().statusTimestamp,
            changeLog: doc.data().changeLog,
          }))
        );

        setTimeout(function () {
          setLoading(false);
        }, 1000);
      });
    }
  }, [userProfile]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // Table UI:
  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ flexGrow: 1 }}>
          {loading ? (
            <HomeSkeleton />
          ) : (
            <Card sx={{ p: { xs: 1.5, md: 2.25 }, border: "1px solid", borderColor: "divider" }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                spacing={1}
                sx={{ mb: 1.5 }}
              >
                <Box>
                  <Typography variant="h5" color="primary" sx={{ fontSize: { xs: 22, sm: 26 } }}>
                    Loaned Equipment Manager
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Track active loaned equipment for {userProfile?.branch}
                  </Typography>
                </Box>
                <Button
                  onClick={handleToggleAddLoanerView}
                  size="small"
                  variant="contained"
                  startIcon={<AddRounded />}
                  sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
                >
                  Add Loaner
                </Button>
              </Stack>

              <Dialog
                key="dialog"
                onClose={handleCloseAddLoanerView}
                open={openAddLoanerView}
                fullWidth
                maxWidth="sm"
                fullScreen={isMobile}
                PaperProps={{
                  sx: {
                    borderRadius: { xs: 0, sm: 3 },
                    overflow: "hidden",
                  },
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <AddLoanerView onClose={handleCloseAddLoanerView} />
                </Box>
              </Dialog>

              <TableContainer
                key="headerContainer"
                component={Paper}
                sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflowX: "auto" }}
              >
                <Table
                  size="small"
                  aria-label="collapsible table"
                  sx={{ minWidth: 820 }}
                >
                  <TableHead>
                    <TableRow key="header">
                      <TableCell
                        key="employee"
                        style={{ fontSize: 18 }}
                        align="left"
                      >
                        <strong>Employee</strong>
                      </TableCell>
                      <TableCell
                        key="model"
                        tyle={{ fontSize: 18 }}
                        align="left"
                      >
                        <strong>Model</strong>
                      </TableCell>
                      <TableCell
                        key="ids"
                        style={{ fontSize: 18 }}
                        align="left"
                      >
                        <strong>ID's</strong>
                      </TableCell>
                      <TableCell
                        key="hours"
                        style={{ fontSize: 18 }}
                        align="left"
                      >
                        <strong>Hours</strong>
                      </TableCell>
                      <TableCell
                        key="customer"
                        style={{ fontSize: 18 }}
                        align="left"
                      >
                        <strong>Customer</strong>
                      </TableCell>
                      <TableCell
                        key="status"
                        style={{ fontSize: 18 }}
                        align="left"
                      >
                        <strong>Status</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {loaners.map((loaner) => (
                      <Row key={loaner.id} loaner={loaner} />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "block", sm: "none" }, mt: 0.75 }}>
                Swipe horizontally to see all table columns.
              </Typography>
            </Card>
          )}
      </Box>
    </Container>
  );
}
