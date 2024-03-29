import React, { useCallback, useEffect, useState } from "react";
import { useStateValue } from "../../state-management/StateProvider";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";
import HomeSkeleton from "../../components/HomeSkeleton";
import "../../styles/Table.css";
import { Link } from "react-router-dom";
import AddTransportView from "../AddTransportView";
import TransportRow from "./TransportManagerRow";
import CalendarView from "../CalendarView";
import { formatPhoneNumber } from "../../utils/utils";
import moment from "moment";
import {
  Box,
  Button,
  Dialog,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableContainer,
  TextField,
  Typography,
} from "@mui/material";
import { AddRounded, CancelOutlined } from "@mui/icons-material";
import TransportTable from "./TransportTable";

// Whole table view:
export default function TransportManager() {
  const [{ userProfile }] = useStateValue();
  const [requests, setRequests] = useState([]);
  const [calendarRequests, setCalendarRequests] = useState([]);
  const [filter, setFilter] = useState("Active");
  const [loading, setLoading] = useState(true);
  const [openAddTransportView, setOpenAddTransportView] = useState(false);

  console.log(moment().format("yyyy-MM-DD"));

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

    // var transportQuery;

    // if (filter === "Active")
    const transportQuery = query(
      collection(db, "branches", userProfile?.branch, "transport"),
      where("status", filter !== "Completed" ? "!=" : "==", "Completed")
    );

    // if (filter === "Completed")
    //   return (transportQuery = query(
    //     collection(db, "branches", userProfile?.branch, "transport"),
    //     where("status", "==", "Completed")
    //   ));

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
          name: doc.data().name,
          phone: doc.data().phone,
          street: doc.data().street,
          city: doc.data().city,
          state: doc.data().state,
          zip: doc.data().zip,
          notes: doc.data().notes,
          type: doc.data().type,
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
          title: `${doc.data().name}, ${doc.data().equipment[0].model}`,
          status: doc.data().status,
          startDate: startDateCheck(
            doc.data().startDate,
            doc.data().requestedDate
          ),
          endDate: endDateCheck(doc.data().endDate, doc.data().requestedDate),
          location: `${doc.data().street}, ${doc.data().city}, ${
            doc.data().state
          } ${doc.data().zip}`,
          phone: doc.data().phone,
          type: doc.data().type,
          hasTrade: doc.data().hasTrade,
          notes: doc.data().notes,
        }))
      );
      setTimeout(function () {
        setLoading(false);
      }, 1000);
    });
  }, [userProfile, filter]);

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
          <Stack direction="row" flexWrap="wrap" justifyContent="space-between" alignItems="flex-end" >
            <Stack direction="row" flexWrap="wrap" alignItems="flex-end">

            <Typography
              variant="h4"
              color="primary"
              style={{ marginLeft: 25, marginBottom: 10, marginTop: 25 }}
              >
              Transport Manager
            </Typography>

            <TextField
              sx={{ mx: 4, mb: 1, mt: 1 }}
              select
              SelectProps={{ style: { fontSize: 14 } }}
              InputLabelProps={{ style: { fontSize: 14 } }}
              size="small"
              // fullWidth
              variant="outlined"
              labelid="filter"
              id="filter"
              value={filter}
              label="Filter"
              onChange={(e) => setFilter(e.target.value)}
              >
              <MenuItem
                key={"active"}
                style={{ fontSize: 14 }}
                value={"Active"}
                >
                Active
              </MenuItem>

              <MenuItem
                key={"completed"}
                style={{ fontSize: 14 }}
                value={"Completed"}
                >
                Completed
              </MenuItem>
            </TextField>
                </Stack>


            <Button
              size="small"
              variant="outlined"
              startIcon={<AddRounded />}
              onClick={handleToggleAddTansportView}
              sx={{ mx: 4, mb: 1, mt: 1 }}
            >
              Submit Delivery/Pickup
            </Button>
          </Stack>

          <Dialog
            onClose={handleCloseAddTansportView}
            open={openAddTransportView}
          >
            <div className="closeButtonContainer">
              <Button onClick={handleCloseAddTansportView}>
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
              <TransportTable requests={requests} />
            </Grid>
            <Grid item xs={12} sm={12} md={7} lg={7}>
              <CalendarView calendarRequests={calendarRequests} />
            </Grid>
          </Grid>
        </React.Fragment>
      )}
    </Box>
  );
}
