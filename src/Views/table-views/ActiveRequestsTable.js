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
import AddRequestView from "../AddRequestView";
import { RequestsTableHeaderView } from "../../components/TableHeaderViews";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import RequestRow from "./ActiveRequestRow";
import { Typography } from "@material-ui/core";

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
        <React.Fragment>
          <div className="tableHead">
            <Typography
              variant="h4"
              color="primary"
              style={{ marginLeft: 25, marginBottom: 10 }}
            >
              Active Setup Requests
            </Typography>

            <Button
              color="success"
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleToggleAddRequestView}
              sx={{ mx: 4, mb: 1, mt: 1 }}
            >
              Submit Request
            </Button>
          </div>

          <Dialog onClose={handleCloseAddRequestView} open={openAddRequestView}>
            <div className="closeButtonContainer">
              <Button onClick={handleCloseAddRequestView} color="success">
                <CancelOutlinedIcon />
              </Button>
            </div>
            <div className="addRequestView">
              <AddRequestView />
            </div>
          </Dialog>

          <TableContainer component={Paper} style={{ borderRadius: 10 }}>
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
        </React.Fragment>
      )}
    </React.Fragment>
  );
}
