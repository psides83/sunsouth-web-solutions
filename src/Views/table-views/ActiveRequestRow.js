import React, { useCallback, useEffect, useState } from "react";
import { useStateValue } from "../../state-management/StateProvider";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  setDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import moment from "moment";
import "../../styles/Table.css";
import { EquipmentTableHeaderView } from "../../components/TableHeaderViews";
import {
  sendWorkOrderEmail,
  sendNewEquipmentEmail,
  sendStatusEmail,
  sendRequestDeletedEmail,
} from "../../services/email-service";
import EquipmentRow from "./EquipmentRows";
import { Link } from "react-router-dom";
import Spinner from "../../components/Spinner";
import {
  Box,
  Button,
  Collapse,
  Dialog,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AddRounded,
  AgricultureRounded,
  Check,
  CheckRounded,
  Close,
  CloseRounded,
  DeleteRounded,
  EditRounded,
  HistoryOutlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
  PrintOutlined,
} from "@mui/icons-material";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
} from "@mui/lab";

// Request row view:
export default function RequestRow({ request }) {
  //#region State Properties
  const [{ user, userProfile }, dispatch] = useStateValue();
  const [open, setOpen] = useState(false);
  var [workOrder, setWorkOrder] = useState("");
  var [currentWorkOrder, setCurrentWorkOrder] = useState("");
  var [equipment, setEquipment] = useState([]);
  var [model, setModel] = useState("");
  var [stock, setStock] = useState("");
  var [serial, setSerial] = useState("");
  var [work, setWork] = useState("");
  var [notes, setNotes] = useState("");
  var [isEditingWorkOrder, setIsEditingWorkOrder] = useState(false);
  var [isShowingAddEquipment, setIsShowingAddEquipment] = useState(false);
  var [workOrderHasChanges, setWorkOrderHasChanges] = useState(false);
  const fullName = `${userProfile?.firstName} ${userProfile?.lastName}`;
  const [openChangeLog, setOpenChangeLog] = useState(false);
  const [isShowingConfirmDialog, setIsShowingConfirmDialog] = useState(false);
  const [isShowingDeleteDialog, setIsShowingDeleteDialog] = useState(false);
  const [isShowingSpinner, setIsShowingSpinner] = useState(false);
  // #endregion

  const handleCloseChangeLog = () => {
    setOpenChangeLog(false);
  };

  const handleToggleChangeLog = () => {
    setOpenChangeLog(!openChangeLog);
  };

  const handleCloseConfirmDialog = () => {
    setIsShowingConfirmDialog(false);
  };

  const handleToggleConfirmDialog = () => {
    setIsShowingConfirmDialog(!isShowingConfirmDialog);
  };

  const handleCloseDeleteDialog = () => {
    setIsShowingDeleteDialog(false);
  };

  const handleToggleDeleteDialog = () => {
    setIsShowingDeleteDialog(!isShowingConfirmDialog);
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
      ),
      orderBy("timestamp", "asc")
    );

    onSnapshot(equipmentQuery, (querySnapshot) => {
      setEquipment(
        querySnapshot.docs.map((doc) => ({
          requestID: doc.data().requestID,
          model: doc.data().model.toString().toUpperCase(),
          stock: doc.data().stock,
          serial: doc.data().serial.toString().toUpperCase(),
          work: doc.data().work,
          notes: doc.data().notes,
          changeLog: doc.data().changeLog,
        }))
      );
    });
  }, [request.id, userProfile.branch]);

  useEffect(() => {
    // Checks for changes in workOrder value and updates state
    if (currentWorkOrder !== workOrder) {
      setWorkOrderHasChanges(true);
    } else {
      setWorkOrderHasChanges(false);
    }

    // Fetch equipment data from firestore
    fetchEquipment();
  }, [
    fetchEquipment,
    currentWorkOrder,
    workOrder,
    isShowingAddEquipment,
    setWorkOrderHasChanges,
  ]);

  // Handles adding or editing the work order number for the request:
  const editWorkOrder = async () => {
    if (isEditingWorkOrder) {
      if (workOrderHasChanges) {
        const workOrderStatus =
          request.workOrder === ""
            ? `Added WO # ${workOrder}`
            : `WO # updated from ${request.workOrder} to ${workOrder}`;

        const changeLogEntry = {
          user: fullName,
          change: workOrderStatus,
          timestamp: moment().format("DD-MMM-yyyy hh:mmA"),
        };

        if (request.workOrder !== workOrder) {
          request.changeLog.push(changeLogEntry);
        }

        await setDoc(
          doc(db, "branches", userProfile.branch, "requests", request.id),
          { workOrder: workOrder, changeLog: request.changeLog },
          { merge: true }
        );
        sendWorkOrderEmail(
          equipment,
          request,
          workOrder,
          fullName,
          model,
          userProfile
        );
        setIsEditingWorkOrder(false);
      } else {
        console.log("no changes to equipment");
        setIsEditingWorkOrder(false);
      }
    } else {
      setWorkOrder(request.workOrder);
      setCurrentWorkOrder(request.workOrder);
      setIsEditingWorkOrder(true);
    }
  };

  // Handles adding equipment to the request:
  const addEquipment = async () => {
    const timestamp = moment().format("DD-MMM-yyyy hh:mmA");

    if (isShowingAddEquipment) {
      if (model !== "" && stock !== "" && serial !== "" && work !== "") {
        const changeLog = [
          {
            user: fullName,
            change: `request created`,
            timestamp: timestamp,
          },
        ];

        const newEquipment = {
          requestID: request.id,
          timestamp: timestamp,
          model: model,
          stock: stock,
          serial: serial,
          work: work,
          notes: notes,
          changeLog: changeLog,
        };

        // Sets the added equipment to firestore:
        const equipmentRef = doc(
          db,
          "branches",
          userProfile.branch,
          "requests",
          request.id,
          "equipment",
          newEquipment.stock
        );
        await setDoc(equipmentRef, newEquipment, { merge: true });

        // Append the equipment addition to the request's changealog
        const changeLogEntry = {
          user: fullName,
          change: `Equipment model ${model} added to the request`,
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
          { changeLog: request.changeLog },
          { merge: true }
        );

        // Send email about addition of equipment
        sendNewEquipmentEmail(
          request,
          equipment,
          timestamp,
          fullName,
          model,
          stock,
          serial,
          work,
          notes,
          userProfile
        );
        // Hides add equipment TextFields
        setIsShowingAddEquipment(false);
        setEquipment([]);
        setModel("");
        setStock("");
        setSerial("");
        setWork("");
        setNotes("");
      } else {
        setIsShowingAddEquipment(false);
      }
    } else {
      setIsShowingAddEquipment(true);
    }
  };

  // Handles updating the request status:
  const updateStatus = async () => {
    setIsShowingSpinner(true);
    var status = request.status;

    switch (status) {
      case "Requested":
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
      "requests",
      request.id
    );
    await setDoc(
      requestRef,
      {
        status: status,
        statusTimestamp: moment().format("DD-MMM-yyyy h:mmA"),
        changeLog: request.changeLog,
      },
      {
        merge: true,
      }
    );

    sendStatusEmail(status, equipment, request, fullName, userProfile);
    handleCloseConfirmDialog();
    setTimeout(function () {
      setIsShowingSpinner(false);
    }, 1000);
  };

  // Sets data for the pdf into a fire store documetnt for the current
  const setPDFData = () => {
    const requestRef = doc(db, "users", userProfile?.id, "pdf", "pdfData");
    setDoc(
      requestRef,
      {
        request: request,
        equipment: equipment,
      },
      {
        merge: true,
      }
    );
  };

  const statusUpdateText = () => {
    if (request.status === "Requested") {
      return "In Progress";
    } else if (request.status === "In Progress") {
      return "Completed";
    } else {
      return "Requested";
    }
  };

  const deleteRequest = async () => {
    await deleteDoc(
      doc(db, "branches", userProfile.branch, "requests", request.id)
    );

    sendRequestDeletedEmail(equipment, request, fullName, userProfile);
  };

  // Request row UI:
  return (
    <React.Fragment>
      <TableRow key={equipment.requestID} sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell key="expand">
          <Tooltip title={open ? "Hide Equipment" : "Show Equipment"}>
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
            >
              {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </Tooltip>
        </TableCell>

        <TableCell key="model" align="left">
          <Typography style={{fontWeight: "bold"}}>{equipment[0]?.model}</Typography>
          <p>
            <small>
              {equipment.length > 1 ? `and ${equipment.length - 1} more` : ""}
            </small>
          </p>
        </TableCell>

        <TableCell key="salesman" align="left" scope="row">
          <Typography component="p">{request.salesman}</Typography>
          <Typography variant="caption">{request.timestamp}</Typography>
        </TableCell>

        <TableCell key="workOrder" align="left">
          {" "}
          {isEditingWorkOrder ? (
            <TextField
              variant="outlined"
              label="Work Order"
              inputProps={{ style: { fontSize: 14 } }}
              size="small"
              onChange={(e) => setWorkOrder(e.target.value)}
              value={workOrder}
            ></TextField>
          ) : (
            request.workOrder
          )}
        </TableCell>

        <TableCell key="status" align="left">
          <Tooltip title="Update Status">
            <Button
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
          <Typography component="p" variant="caption">
            {request.statusTimestamp}
          </Typography>

          <Dialog
            onClose={handleCloseConfirmDialog}
            open={isShowingConfirmDialog}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                margin: "5px 25px 25px 25px",
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
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginTop: "25px",
                    }}
                  >
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleCloseConfirmDialog}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      onClick={updateStatus}
                    >
                      Update
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Dialog>
        </TableCell>

        <TableCell key="buttons" align="right">
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
                  {" "}
                  {request.changeLog.map((change, index) => (
                    <TimelineItem key={index} >
                      <TimelineSeparator>
                        <TimelineDot variant="outlined" color="primary" />
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

            <div>
              <Link
                target="_blank"
                rel="noopener noreferrer"
                to={"request-pdf"}
                onClick={setPDFData}
              >
                <IconButton aria-label="show">
                  <Tooltip title="Print">
                    <PrintOutlined />
                  </Tooltip>
                </IconButton>
              </Link>
            </div>

            <div className="editIcon">
              <IconButton onClick={editWorkOrder}>
                {" "}
                {isEditingWorkOrder ? (
                  workOrderHasChanges ? (
                    <Tooltip title="Save">
                      <Check color="primary" style={{ fontSize: 18 }} />
                    </Tooltip>
                  ) : (
                    <Tooltip title="Cancel">
                      <Close color="primary" style={{ fontSize: 18 }} />
                    </Tooltip>
                  )
                ) : (
                  <div className="edit-button-bg">
                    <Tooltip title="Edit Work Order">
                      <EditRounded color="primary" style={{ fontSize: 16 }} />
                    </Tooltip>
                  </div>
                )}
              </IconButton>
            </div>
            <div className="delete-button">
              {isEditingWorkOrder ? (
                <IconButton
                  color="primary"
                  style={{ fontSize: 20 }}
                  onClick={handleToggleDeleteDialog}
                >
                  <Tooltip title="Delete Equipment">
                    <DeleteRounded color="error" style={{ fontSize: 18 }} />
                  </Tooltip>
                </IconButton>
              ) : null}
            </div>
          </div>

          <Dialog
            onClose={handleCloseDeleteDialog}
            open={isShowingDeleteDialog}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                margin: "5px 25px 25px 25px",
              }}
            >
              <DialogTitle>Confirm Delete</DialogTitle>
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
                  <Typography>Are you sure you want to delete</Typography>
                  <Typography>delete this request?</Typography>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginTop: "25px",
                    }}
                  >
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={handleCloseDeleteDialog}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={deleteRequest}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Dialog>
        </TableCell>
      </TableRow>

      <TableRow key="equipmentRow">
        <TableCell
          key="equipmentCell"
          style={{ paddingBottom: 0, paddingTop: 0 }}
          colSpan={6}
        >
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="subtitle1" gutterBottom component="div">
                {`Request ID: ${request.id}`}
              </Typography>
              <Table size="small" aria-label="equipment">
                <EquipmentTableHeaderView />
                <TableBody>
                  {" "}
                  {equipment.map((item) => (
                    <EquipmentRow
                      key={item?.stock}
                      request={request}
                      item={item}
                    />
                  ))}
                </TableBody>
                <TableFooter>
                  {isShowingAddEquipment ? (
                    <TableRow
                      key="addEquipmentRow"
                      sx={{ '& > *': { borderBottom: 'unset' } }}
                    >
                      <TableCell key="addModel" component="th" scope="row">
                        <TextField
                          variant="outlined"
                          label="Model"
                          size="small"
                          onChange={(e) =>
                            setModel(e.target.value.toUpperCase())
                          }
                          value={model}
                        ></TextField>
                      </TableCell>

                      <TableCell key="addIds">
                        <br />
                        <p>
                          <TextField
                            variant="outlined"
                            label="Stock"
                            size="small"
                            onChange={(e) => setStock(e.target.value)}
                            value={stock}
                          ></TextField>
                        </p>
                        <br />
                        <p>
                          <TextField
                            variant="outlined"
                            label="Serial"
                            size="small"
                            onChange={(e) =>
                              setSerial(e.target.value.toUpperCase())
                            }
                            value={serial}
                          ></TextField>
                        </p>
                      </TableCell>

                      <TableCell key="addWork">
                        <TextField
                          variant="outlined"
                          label="Work"
                          size="small"
                          onChange={(e) => setWork(e.target.value)}
                          value={work}
                        ></TextField>
                      </TableCell>

                      <TableCell key="addNotes">
                        <TextField
                          variant="outlined"
                          label="Notes"
                          size="small"
                          onChange={(e) => setNotes(e.target.value)}
                          value={notes}
                        ></TextField>
                      </TableCell>

                      <TableCell key="saveAddButton" align="center">
                        <IconButton
                          style={{ fontSize: 20 }}
                          onClick={addEquipment}
                        >
                          {" "}
                          {model !== "" &&
                          stock !== "" &&
                          serial !== "" &&
                          work !== "" ? (
                            <Tooltip title="Save">
                              <CheckRounded
                                color="primary"
                                style={{ fontSize: 18 }}
                              />
                            </Tooltip>
                          ) : (
                            <Tooltip title="Cancel">
                              <CloseRounded
                                color="primary"
                                style={{ fontSize: 18 }}
                              />
                            </Tooltip>
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {!isShowingAddEquipment ? (
                    <TableRow
                      key="addButtonRow"
                      sx={{ '& > *': { borderBottom: 'unset' } }}
                      style={{ fontSize: 18 }}
                    >
                      <TableCell key="addButtonCell">
                        <Tooltip title="Add Equipment">
                          <Button
                            startIcon={[<AddRounded />, <AgricultureRounded />]}
                            onClick={addEquipment}
                          ></Button>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableFooter>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}
