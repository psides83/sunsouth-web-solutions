import React, { useCallback, useEffect, useState } from "react";
import { useStateValue } from "../../state-management/StateProvider";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";
import HomeSkeleton from "../../components/HomeSkeleton";
import "../../styles/Table.css";
import AddTransportView from "../AddTransportView";
import CalendarView from "../CalendarView";
import {
  Box,
  Button,
  Card,
  Container,
  Dialog,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AddRounded } from "@mui/icons-material";
import TransportTable from "./TransportTable";

// Whole table view:
export default function TransportManager() {
  const [{ userProfile }] = useStateValue();
  const [requests, setRequests] = useState([]);
  const [calendarRequests, setCalendarRequests] = useState([]);
  const [filter, setFilter] = useState("Active");
  const [loading, setLoading] = useState(true);
  const [openAddTransportView, setOpenAddTransportView] = useState(false);

  const handleCloseAddTansportView = () => {
    setOpenAddTransportView(false);
  };

  const handleToggleAddTansportView = () => {
    setOpenAddTransportView(!openAddTransportView);
  };

  // Fetch requests from firestore:
  const fetch = useCallback(async () => {
    if (userProfile === null || userProfile === undefined)
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
      if (startDate === undefined) return `${requestedDate}T07:00`;
      if (startDate === null) return `${requestedDate}T07:00`;
      if (startDate === "") return `${requestedDate}T07:00`;
      return startDate;
    };

    const endDateCheck = (endDate, requestedDate) => {
      if (endDate === undefined) return `${requestedDate}T09:00`;
      if (endDate === null) return `${requestedDate}T09:00`;
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
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      {loading ? (
        <HomeSkeleton />
      ) : (
        <Card sx={{ p: { xs: 1.5, md: 2.25 }, border: "1px solid", borderColor: "divider" }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "flex-end" }}>
              <Typography variant="h5" color="primary" sx={{ fontSize: { xs: 22, sm: 26 } }}>
                Transport Manager
              </Typography>

              <TextField
                sx={{ minWidth: { xs: "100%", sm: 170 } }}
                select
                SelectProps={{ style: { fontSize: 14 } }}
                InputLabelProps={{ style: { fontSize: 14 } }}
                size="small"
                variant="outlined"
                labelid="filter"
                id="filter"
                value={filter}
                label="Filter"
                onChange={(e) => setFilter(e.target.value)}
              >
                <MenuItem key={"active"} style={{ fontSize: 14 }} value={"Active"}>
                  Active
                </MenuItem>

                <MenuItem key={"completed"} style={{ fontSize: 14 }} value={"Completed"}>
                  Completed
                </MenuItem>
              </TextField>
            </Stack>


            <Button
              size="small"
              variant="contained"
              startIcon={<AddRounded />}
              onClick={handleToggleAddTansportView}
              sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
            >
              Submit Delivery/Pickup
            </Button>
          </Stack>

          <Dialog
            onClose={handleCloseAddTansportView}
            open={openAddTransportView}
            fullWidth
            maxWidth="md"
          >
            <Box sx={{ display: "flex", justifyContent: "center", p: 1 }}>
              <AddTransportView
                handleCloseAddTansportView={handleCloseAddTansportView}
              />
            </Box>
          </Dialog>

          <Grid
            container
            style={{
              display: "flex",
              justifyContent: "center",
            }}
            spacing={2}
          >
            <Grid item xs={12} sm={12} md={5} lg={5}>
              <TransportTable requests={requests} />
            </Grid>
            <Grid item xs={12} sm={12} md={7} lg={7}>
              <CalendarView calendarRequests={calendarRequests} />
            </Grid>
          </Grid>
          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "block", md: "none" }, mt: 0.75 }}>
            Swipe horizontally on the transport table for additional columns.
          </Typography>
        </Card>
      )}
    </Container>
  );
}
