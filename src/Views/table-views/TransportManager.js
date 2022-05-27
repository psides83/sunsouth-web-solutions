import React, { useCallback, useEffect, useState } from "react";
import { useStateValue } from "../../state-management/StateProvider";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";
import HomeSkeleton from "../../components/HomeSkeleton";
import "../../styles/Table.css";
import { Link } from "react-router-dom";
import AddTransportView from "../AddTransportView";
import { TransportTableHeaderView } from "../../components/TableHeaderViews";
import TransportRow from "./TransportManagerRow";
import CalendarView from "../CalendarView";
import { formatPhoneNumber } from "../../utils/utils";
import moment from "moment";
import {
  Box,
  Button,
  Dialog,
  Grid,
  Paper,
  Table,
  TableBody,
  TableContainer,
  Typography,
} from "@mui/material";
import { AddRounded, CancelOutlined } from "@mui/icons-material";

// Whole table view:
export default function TransportManager() {
  const [{ userProfile }] = useStateValue();
  const [requests, setRequests] = useState([]);
  const [calendarRequests, setCalendarRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddTransportView, setOpenAddTransportView] = useState(false);

  console.log(moment().format("yyyy-mm-DD"));

  const handleCloseAddTansportView = () => {
    setOpenAddTransportView(false);
  };

  const handleToggleAddTansportView = () => {
    setOpenAddTransportView(!openAddTransportView);
  };

  // Fetch requests from firestore:
  const fetch = useCallback(async () => {
    if (userProfile == null || userProfile == undefined)
      return console.log("userProfile not loaded");

    const transportQuery = query(
      collection(db, "branches", userProfile?.branch, "transport"),
      where("status", "!=", "Completed")
    );

    const startDateCheck = (startDate, requestedDate) => {
      if (startDate == undefined) return `${requestedDate}T07:00`;
      if (startDate == null) return `${requestedDate}T07:00`;
      if (startDate === "") return `${requestedDate}T07:00`;
      return startDate;
    };

    const endDateCheck = (endDate, requestedDate) => {
      if (endDate == undefined) return `${requestedDate}T09:00`;
      if (endDate == null) return `${requestedDate}T09:00`;
      if (endDate === "") return `${requestedDate}T09:00`;
      return endDate;
    };

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
              size="small"
              variant="outlined"
              startIcon={<AddRounded />}
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
              <Button onClick={handleCloseAddTansportView} >
                <CancelOutlined />
              </Button>
            </div>
            <div className="addRequestView">
              <AddTransportView
                handleCloseAddTansportView={handleCloseAddTansportView}
              />
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
            <Grid item xs={12} sm={12} md={5} lg={5}>
              <TableContainer component={Paper} style={{ borderRadius: 10 }}>
                <Table
                  size="small"
                  aria-label="collapsible table"
                  // style={{ margin: 15 }}
                  sx={{ paddingTop: 2 }}
                >
                  {/* <TransportTableHeaderView /> */}
                  <TableBody>
                    {requests.map((request) => (
                      <TransportRow request={request} />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} sm={12} md={7} lg={7}>
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
