import React, { useCallback, useEffect, useState } from "react";
import { useStateValue } from "../../state-management/StateProvider";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  setDoc,
  doc,
} from "firebase/firestore";
import moment from "moment";
import HomeSkeleton from "../../components/HomeSkeleton";
import "../../styles/Table.css";
import {
  EquipmentTableHeaderView,
  RequestsTableHeaderView,
} from "../../components/TableHeaderViews";
import {
  Box,
  Button,
  Collapse,
  Dialog,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  HistoryOutlined,
  KeyboardArrowDownRounded,
  KeyboardArrowUpRounded,
} from "@mui/icons-material";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
} from "@mui/lab";

// Equipment row view:
function EquipmentRow({ item }) {
  // const [{ userProfile }] = useStateValue();

  // Equipment row UI:
  return (
    <React.Fragment>
      <TableRow key={"id"} style={{ fontSize: 18, borderBottom: "unset" }}>
        <TableCell key={"model"} align="left" component="th" scope="row">
          {item.model}
        </TableCell>
        <TableCell key={"stock"} align="left">
          {`Stock: ${item.stock}`}
          <p>
            <small>{`Serial: ${item.serial}`}</small>
          </p>
        </TableCell>
        <TableCell key={"work"} align="left">
          {" "}
          {item.work}
        </TableCell>
        <TableCell key={"notes"} align="left">
          {" "}
          {item.notes}
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

// Request row view:
function Row({ request }) {
  const [{ userProfile }] = useStateValue();
  const [open, setOpen] = useState(false);
  var [equipment, setEquipment] = useState([]);
  const fullName = `${userProfile?.firstName} ${userProfile?.lastName}`;
  const [openChangeLog, setOpenChangeLog] = useState(false);

  const handleCloseChangeLog = () => {
    setOpenChangeLog(false);
  };
  const handleToggleChangeLog = () => {
    setOpenChangeLog(!openChangeLog);
  };

  // Fetches equipment from firestore:
  const fetchEquipment = useCallback(() => {
    const equipmentQuery = query(
      collection(
        db,
        "branches",
        userProfile?.branch,
        "requests",
        request.id,
        "equipment"
      )
    );

    onSnapshot(equipmentQuery, (querySnapshot) => {
      setEquipment(
        querySnapshot.docs.map((doc) => ({
          requestID: doc.data().requestID,
          model: doc.data().model,
          stock: doc.data().stock,
          serial: doc.data().serial,
          work: doc.data().work,
          notes: doc.data().notes,
          changeLog: doc.data().changeLog,
        }))
      );
    });
  }, [request.id, userProfile.branch]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  // Handles updating the request status:
  const updateStatus = async () => {
    var status = request.status;

    switch (status) {
      case "Requested":
        status = "In Progress";
        break;
      case "In Progress":
        status = "Complete";
        break;
      default:
        status = "Complete";
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
      "requests",
      request.id
    );

    await setDoc(
      requestRef,
      {
        status: status,
        statusTimestamp: moment().format("DD-MMM-yyyy"),
        changeLog: request.changeLog,
      },
      { merge: true }
    );
  };

  // Request row UI:
  return (
    <React.Fragment>
      <TableRow key={request.id} style={{ borderBottom: "unset" }}>
        <TableCell>
          <Tooltip title={open ? "Hide Equipment" : "Show Equipment"}>
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
            >
              {open ? <KeyboardArrowUpRounded /> : <KeyboardArrowDownRounded />}
            </IconButton>
          </Tooltip>
        </TableCell>

        <TableCell align="left">
          <strong className="model">{equipment[0]?.model}</strong>
          <p>
            <small>
              {equipment.length > 1 ? `and ${equipment.length - 1} more` : ""}
            </small>
          </p>
        </TableCell>

        <TableCell component="th" scope="row">
          <p>{request.salesman}</p>
          <small>{request.timestamp}</small>
        </TableCell>

        <TableCell align="left">{request.workOrder}</TableCell>

        <TableCell align="left">
          <Tooltip title="Update Status">
            <Button
              color="success"
              size="small"
              sx={{ width: "115px", pt: "5px" }}
              variant={
                request.status === "In Progress" ? "contained" : "outlined"
              }
              onClick={updateStatus}
            >
              {request.status}
            </Button>
          </Tooltip>
          <p>
            <small>{request.statusTimestamp}</small>
          </p>
        </TableCell>

        <TableCell align="right">
          <div className="cellButtons">
            <div>
              <IconButton aria-label="show" onClick={handleToggleChangeLog}>
                <Tooltip title="Show Changes">
                  <HistoryOutlined />
                </Tooltip>
              </IconButton>

              <Dialog onClose={handleCloseChangeLog} open={openChangeLog}>
                <DialogTitle>Request Change History</DialogTitle>
                <Timeline position="alternate">
                  {request.changeLog.map((change) => (
                    <TimelineItem>
                      <TimelineSeparator>
                        <TimelineDot variant="outlined" color="success" />
                        {request.changeLog.indexOf(change) + 1 !==
                        request.changeLog.length ? (
                          <TimelineConnector />
                        ) : null}
                      </TimelineSeparator>

                      <TimelineContent>
                        <p>
                          <small>{change.timestamp}</small>
                        </p>
                        <small>{change.user}</small>
                        <p>
                          <small>{change.change}</small>
                        </p>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </Dialog>
            </div>
          </div>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Table size="small" aria-label="equipment">
                <EquipmentTableHeaderView />

                <TableBody>
                  {equipment.map((item) => (
                    <EquipmentRow key={item?.stock} item={item} />
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

export default function CompletedTable() {
  const [{ userProfile }] = useStateValue();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(30);

  const filters = [30, 60, 90, "1 year"];

  // Fetch requests from firestore:
  const fetch = useCallback(async () => {
    if (userProfile) {
      var dateRange;

      filter === "1 year"
        ? (dateRange = moment().subtract(1, "years").format("yyyyMMDD"))
        : (dateRange = moment().subtract(filter, "days").format("yyyyMMDD"));

      var requestsQuery = query(
        collection(db, "branches", userProfile?.branch, "requests"),
        where("status", "==", "Completed"),
        where("id", ">", dateRange),
        orderBy("id", "desc")
      );

      const docSnapshot = await getDocs(requestsQuery);

      setRequests(
        docSnapshot.docs.map((doc) => ({
          id: doc.data().id,
          salesman: doc.data().salesman,
          timestamp: doc.data().timestamp,
          workOrder: doc.data().workOrder,
          status: doc.data().status,
          statusTimestamp: doc.data().statusTimestamp,
          changeLog: doc.data().changeLog,
        }))
      );
    }
  }, [userProfile, filter]);

  useEffect(() => {
    fetch();
    setTimeout(function () {
      setLoading(false);
    }, 1000);
  }, [fetch]);

  // Table UI:
  return (
    <React.Fragment>
      {loading ? (
        <HomeSkeleton />
      ) : (
        <div className="tableHead">
          <Typography
            variant="h4"
            color="primary"
            style={{ marginLeft: 25, marginBottom: 10 }}
          >
            Completed Setup Requests
          </Typography>

          <TextField
            size="small"
            variant="outlined"
            labelId="demo-simple-select-label"
            id="filter"
            style={{
              "&:before": {
                borderColor: (theme) => theme.palette.secondary.main,
              },
              "&:after": {
                borderColor: (theme) => theme.palette.secondary.main,
              },
              "&:not(.Mui-disabled):hover::before": {
                borderColor: (theme) => theme.palette.secondary.main,
              },
            }}
            value={filter}
            label="Previous Days"
            onChange={(e) => setFilter(e.target.value)}
            select
          >
            {filters.map((filter) => (
              <MenuItem value={filter}>{filter.toString()}</MenuItem>
            ))}
          </TextField>
        </div>
      )}
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
              <Row request={request} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </React.Fragment>
  );
}
