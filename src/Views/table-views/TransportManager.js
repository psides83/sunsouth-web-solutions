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
import { RequestsTableHeaderView } from "../../components/TableHeaderViews";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import TransportRow from "./TransportManagerRow";
import { Typography } from "@material-ui/core";

// Whole table view:
export default function TransportManager() {
  const [{ userProfile }] = useStateValue();
  const [requests, setRequests] = useState([]);
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
    if (userProfile) {
      const transportQuery = query(
        collection(db, "branches", userProfile?.branch, "transports"),
        where("status", "!=", "Completed")
      );

      onSnapshot(transportQuery, (querySnapshot) => {
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
                  <TransportRow request={request} />
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
