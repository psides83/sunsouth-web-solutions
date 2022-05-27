import React, { useCallback, useEffect, useState } from "react";
import { useStateValue } from "../../state-management/StateProvider";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";
import HomeSkeleton from "../../components/HomeSkeleton";
import "../../styles/Table.css";
import { Link } from "react-router-dom";
import AddRequestView from "../AddRequestView";
import { RequestsTableHeaderView } from "../../components/TableHeaderViews";
import RequestRow from "./ActiveRequestRow";
import {
  Box,
  Button,
  Dialog,
  Paper,
  Stack,
  Table,
  TableBody,
  TableContainer,
  Typography,
} from "@mui/material";
import { AddRounded, CancelOutlined } from "@mui/icons-material";

// Whole table view:
export default function ActiveRequestsTable() {
  const [{ userProfile }] = useStateValue();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddRequestView, setOpenAddRequestView] = useState(false);

  const handleCloseAddRequestView = () => {
    setOpenAddRequestView(false);
  };

  const handleToggleAddRequestView = () => {
    setOpenAddRequestView(!openAddRequestView);
  };

  // Fetch requests from firestore:
  const fetch = useCallback(async () => {
    if (userProfile) {
      const requestsQuery = query(
        collection(db, "branches", userProfile?.branch, "requests"),
        where("status", "!=", "Completed")
      );

      onSnapshot(requestsQuery, (querySnapshot) => {
        setRequests(
          querySnapshot.docs.map((doc) => ({
            id: doc.data().id,
            salesman: doc.data().salesman,
            timestamp: doc.data().timestamp,
            workOrder: doc.data().workOrder,
            status: doc.data().status,
            statusTimestamp: doc.data().statusTimestamp,
            changeLog: doc.data().changeLog,
          }))
        );
        setTimeout(function () {
          setLoading(false);
        }, 1000);
      });
    } else {
      console.log("userProfile not loaded");
    }
  }, [userProfile]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // Table UI:
  return (
    <React.Fragment>
      {loading ? (
        <HomeSkeleton />
      ) : (
        <Box display="flex" flexDirection="column" alignItems="center" >
          <Stack direction="row"
            style={{
              width: "100%",
              maxWidth: "1100px",
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant="h4"
              color="primary"
              style={{ marginLeft: 25, marginBottom: 10 }}
            >
              Active Setup Requests
            </Typography>

            <Button
              size="small"
              variant="outlined"
              startIcon={<AddRounded />}
              onClick={handleToggleAddRequestView}
              sx={{ mx: 4, mb: 1, mt: 1 }}
            >
              Submit Request
            </Button>
          </Stack>

          <Dialog onClose={handleCloseAddRequestView} open={openAddRequestView}>
            <div className="closeButtonContainer">
              <Button onClick={handleCloseAddRequestView} color="success">
                <CancelOutlined />
              </Button>
            </div>
            <div className="addRequestView">
              <AddRequestView />
            </div>
          </Dialog>

          <TableContainer
            component={Paper}
            style={{ borderRadius: 10, maxWidth: "1100px" }}
          >
            <Table
              size="small"
              aria-label="collapsible table"
              style={{ margin: 15 }}
              sx={{ paddingTop: 2 }}
            >
              <RequestsTableHeaderView />
              <TableBody>
                {requests.map((request) => (
                  <RequestRow request={request} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <div className="completed-link">
            <Link to={"/completed"}>
              <h3>View completed requests</h3>
            </Link>
          </div>
        </Box>
      )}
    </React.Fragment>
  );
}
