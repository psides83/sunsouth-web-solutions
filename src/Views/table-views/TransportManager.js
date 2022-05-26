import React, { useCallback, useEffect, useState } from "react";
import { useStateValue } from "../../state-management/StateProvider";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableContainer from "@material-ui/core/TableContainer";
import Paper from "@material-ui/core/Paper";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";
import Button from "@mui/material/Button";
import HomeSkeleton from "../../components/HomeSkeleton";
import "../../styles/Table.css";
import { Link } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import Dialog from "@mui/material/Dialog";
import AddTransportView from "../AddTransportView";
import { TransportTableHeaderView } from "../../components/TableHeaderViews";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import TransportRow from "./TransportManagerRow";
import { Box, Grid, Typography } from "@material-ui/core";
import CalendarView from "../CalendarView";

// Whole table view:
export default function TransportManager() {
  const [{ userProfile }] = useStateValue();
  const [requests, setRequests] = useState([]);
  const [calendarRequests, setCalendarRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddTransportView, setOpenAddTransportView] = useState(false);

  const handleCloseAddTansportView = () => {
    setOpenAddTransportView(false);
  };

  const handleToggleAddTansportView = () => {
    setOpenAddTransportView(!openAddTransportView);
  };

  // TODO update with transport collection instead of pdi colletion
  // Fetch requests from firestore:
  const fetch = useCallback(async () => {
    if (userProfile == null || userProfile == undefined)
      return console.log("userProfile not loaded");

    const transportQuery = query(
      collection(db, "branches", userProfile?.branch, "transport"),
      where("status", "!=", "Completed")
    );

    const startDateCheck = (startDate, requestedDate) => {
      console.log(startDate);
      console.log(requestedDate);
      if (startDate == undefined) return `${requestedDate}T07:00`;
      if (startDate == null) return `${requestedDate}T07:00`;
      if (startDate === "") return `${requestedDate}T07:00`;
      return startDate;
    };

    const endDateCheck = (endDate, requestedDate) => {
      console.log(endDate);
      if (endDate == undefined) return `${requestedDate}T09:00`;
      if (endDate == null) return `${requestedDate}T09:00`;
      if (endDate === "") return `${requestedDate}T09:00`;
      return endDate;
    };

    function formatPhoneNumber(phoneNumberString) {
      var cleaned = ("" + phoneNumberString).replace(/\D/g, "");
      var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
      if (match) {
        return "(" + match[1] + ") " + match[2] + "-" + match[3];
      }
      return null;
    }

    onSnapshot(transportQuery, (querySnapshot) => {
      setRequests(
        querySnapshot.docs.map((doc) => ({
          id: doc.data().id,
          salesman: doc.data().salesman,
          timestamp: doc.data().timestamp,
          workOrder: doc.data().workOrder,
          customerName: doc.data().customerName,
          customerPhone: doc.data().customerPhone,
          customerStreet: doc.data().customerStreet,
          customerCity: doc.data().customerCity,
          customerState: doc.data().customerState,
          customerZip: doc.data().customerZip,
          requestNotes: doc.data().requestNotes,
          requestType: doc.data().requestType,
          requestedDate: doc.data().requestedDate,
          hasTrade: doc.data().hasTrade,
          startDate: doc.data().startDate,
          endDate: doc.data().endDate,
          status: doc.data().status,
          statusTimestamp: doc.data().statusTimestamp,
          equipment: doc.data().equipment,
          changeLog: doc.data().changeLog,
        }))
      );

      setCalendarRequests(
        querySnapshot.docs.map((doc) => ({
          id: doc.data().id,
          title: `${doc.data().customerName}, ${doc.data().equipment[0].model}`,
          status: doc.data().status,
          startDate: startDateCheck(
            doc.data().startDate,
            doc.data().requestedDate
          ),
          endDate: endDateCheck(doc.data().endDate, doc.data().requestedDate),
          location: `${doc.data().customerStreet}, ${
            doc.data().customerCity
          }, ${doc.data().customerState} ${doc.data().customerZip}`,
          phone: formatPhoneNumber(doc.data().customerPhone),
          type: doc.data().requestType,
          hasTrade: doc.data().hasTrade,
        }))
      );
      setTimeout(function () {
        setLoading(false);
      }, 1000);
    });
    console.table(calendarRequests);
  }, [userProfile]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // Table UI:
  return (
    <Box>
      {loading ? (
        <HomeSkeleton />
      ) : (
        <React.Fragment>
          <div className="tableHead">
            <Typography
              variant="h4"
              color="primary"
              style={{ marginLeft: 25, marginBottom: 10, marginTop: 25 }}
            >
              Transport Manager
            </Typography>

            <Button
              color="success"
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleToggleAddTansportView}
              sx={{ mx: 4, mb: 1, mt: 1 }}
            >
              Submit Delivery/Pickup
            </Button>
          </div>

          <Dialog
            onClose={handleCloseAddTansportView}
            open={openAddTransportView}
          >
            <div className="closeButtonContainer">
              <Button onClick={handleCloseAddTansportView} color="success">
                <CancelOutlinedIcon />
              </Button>
            </div>
            <div className="addRequestView">
              <AddTransportView />
            </div>
          </Dialog>

          <Grid
            container
            style={{
              display: "flex",
              justifyContent: "center",
            }}
            spacing={1}
          >
            <Grid
              item
              xs={12}
              sm={12}
              md={5}
              lg={5}
            >
              <TableContainer component={Paper} style={{ borderRadius: 10 }}>
                <Table
                  size="small"
                  aria-label="collapsible table"
                  // style={{ margin: 15 }}
                  sx={{ paddingTop: 2 }}
                >
                  <TransportTableHeaderView />
                  <TableBody>
                    {requests.map((request) => (
                      <TransportRow request={request} />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid
              item
              xs={12}
              sm={12}
              md={7}
              lg={7}
            >
              <CalendarView calendarRequests={calendarRequests} />
            </Grid>
          </Grid>
          <div className="completed-link">
            <Link to={"/completed"}>
              <h3>View completed requests</h3>
            </Link>
          </div>
        </React.Fragment>
      )}
    </Box>
  );
}