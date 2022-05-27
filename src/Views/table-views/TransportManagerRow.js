import React, { useCallback, useEffect, useState } from "react";
import { useStateValue } from "../../state-management/StateProvider";
import { setDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import moment from "moment";
import "../../styles/Table.css";
import {
  EquipmentTableHeaderView,
  TransportEquipmentTableHeaderView,
} from "../../components/TableHeaderViews";
import {
  sendWorkOrderEmail,
  sendNewEquipmentEmail,
  sendStatusEmail,
  sendRequestDeletedEmail,
  sendNewTransportEquipmentEmail,
} from "../../services/email-service";
import EquipmentRow from "./EquipmentRows";
import { Link } from "react-router-dom";
import Spinner from "../../components/Spinner";
import TransportEquipmentRow from "./TransportEquipmentRows";
import TransportUpdateDialog from "../TransportUpdateDialog";
import EditTransportView from "../EditTransportView";
import {
  Box,
  Button,
  Collapse,
  Dialog,
  DialogTitle,
  IconButton,
  Stack,
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
  CancelOutlined,
  CheckRounded,
  CloseRounded,
  DeleteRounded,
  EditRounded,
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

// TODO update for transport
// Request row view:
export default function TransportRow(props) {
  //#region State Properties
  const { request } = props;
  const [{ user, userProfile }, dispatch] = useStateValue();
  const [open, setOpen] = useState(false);
  var [workOrder, setWorkOrder] = useState("");
  var [currentWorkOrder, setCurrentWorkOrder] = useState("");
  var [equipment, setEquipment] = useState([]);
  var [model, setModel] = useState("");
  var [stock, setStock] = useState("");
  var [serial, setSerial] = useState("");
  var [notes, setNotes] = useState("");
  var [isEditingWorkOrder, setIsEditingWorkOrder] = useState(false);
  var [isShowingAddEquipment, setIsShowingAddEquipment] = useState(false);
  var [workOrderHasChanges, setWorkOrderHasChanges] = useState(false);
  const fullName = `${userProfile?.firstName} ${userProfile?.lastName}`;
  const [openChangeLog, setOpenChangeLog] = useState(false);
  const [isShowingConfirmDialog, setIsShowingConfirmDialog] = useState(false);
  const [isShowingDeleteDialog, setIsShowingDeleteDialog] = useState(false);
  const [isShowingSpinner, setIsShowingSpinner] = useState(false);
  const [openAddTransportView, setOpenAddTransportView] = useState(false);
  // #endregion

  const handleCloseEditTansportView = () => {
    setOpenAddTransportView(false);
  };

  const handleToggleEditTansportView = () => {
    setOpenAddTransportView(!openAddTransportView);
  };

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

  // Handles adding or editing the work order number for the request:
  // const editWorkOrder = async () => {
  //   if (isEditingWorkOrder) {
  //     if (workOrderHasChanges) {
  //       const workOrderStatus =
  //         request.workOrder === ""
  //           ? `Added WO # ${workOrder}`
  //           : `WO # updated from ${request.workOrder} to ${workOrder}`;

  //       const changeLogEntry = {
  //         user: fullName,
  //         change: workOrderStatus,
  //         timestamp: moment().format("DD-MMM-yyyy hh:mmA"),
  //       };

  //       if (request.workOrder !== workOrder) {
  //         request.changeLog.push(changeLogEntry);
  //       }

  //       await setDoc(
  //         doc(db, "branches", userProfile.branch, "transport", request.id),
  //         { workOrder: workOrder, changeLog: request.changeLog },
  //         { merge: true }
  //       );

  //       // TODO upadate to transport WO email
  //       // sendWorkOrderEmail(
  //       //   request.equipment,
  //       //   request,
  //       //   workOrder,
  //       //   fullName,
  //       //   model,
  //       //   userProfile
  //       // );
  //       setIsEditingWorkOrder(false);
  //     } else {
  //       console.log("no changes to equipment");
  //       setIsEditingWorkOrder(false);
  //     }
  //   } else {
  //     setWorkOrder(request.workOrder);
  //     setCurrentWorkOrder(request.workOrder);
  //     setIsEditingWorkOrder(true);
  //   }
  // };

  const resetEquipmentFields = async () => {
    setModel("");
    setStock("");
    setSerial("");
    setNotes("");
  }

  // Handles adding equipment to the request:
  const addEquipment = async (e) => {
    e.preventDefault()


    if (isShowingAddEquipment) {
      if (model !== "" && stock !== "" && serial !== "") {
        const timestamp = moment().format("DD-MMM-yyyy hh:mmA");
        const id = moment().format("yyyyMMDDHHmmss");

        const newEquipment = {
          id: id,
          model: model,
          stock: stock,
          serial: serial,
          notes: notes,
        };

        request.equipment.push(newEquipment);

        // Append the equipment addition to the request's changealog
        const changeLogEntry = {
          user: fullName,
          change: `Equipment model ${model} added to the request`,
          timestamp: moment().format("DD-MMM-yyyy hh:mmA"),
        };

        request.changeLog.push(changeLogEntry);

        // Sets the added equipment to firestore:
        const docRef = doc(
          db,
          "branches",
          userProfile.branch,
          "transport",
          request.id
        );
        await setDoc(
          docRef,
          { equipment: request.equipment, changeLog: request.changeLog },
          { merge: true }
        );

        // Send email about addition of equipment
        sendNewTransportEquipmentEmail(
          request,
          newEquipment,
          timestamp,
          fullName,
          userProfile
        );

        // Hides add equipment TextFields
        setIsShowingAddEquipment(false);
        await resetEquipmentFields();
      } else {
        setIsShowingAddEquipment(false);
      }
    } else {
      setIsShowingAddEquipment(true);
    }
  };

  // TODO build a transport PDF and update this to transport PDF
  // Sets data for the pdf into a fire store documetnt for the current
  // const setPDFData = () => {
  //   const requestRef = doc(db, "users", userProfile?.id, "pdf", "pdfData");
  //   setDoc(
  //     requestRef,
  //     {
  //       request: request,
  //       equipment: equipment,
  //     },
  //     {
  //       merge: true,
  //     }
  //   );
  // };

  const deleteRequest = async () => {
    await deleteDoc(
      doc(db, "branches", userProfile.branch, "trasnport", request.id)
    );

    // TODO update to transport deleted email
    // sendRequestDeletedEmail(equipment, request, fullName, userProfile);
  };

  // Request row UI:
  return (
    <React.Fragment>
      <TableRow
        key={request.equipment.id}
        sx={{ '& > *': { borderBottom: 'unset' } }}
      >
        <TableCell key="expand">
          <Stack alignItems="start">
            <Typography variant="h6">{request.requestType}</Typography>
            <Typography component="p" variant="caption">
              WO#: {request.workOrder}
            </Typography>
            <Tooltip title={open ? "Hide Equipment" : "Show Equipment"}>
              <IconButton
                aria-label="expand row"
                size="small"
                onClick={() => setOpen(!open)}
              >
                {open ? (
                  <KeyboardArrowUpRounded />
                ) : (
                  <KeyboardArrowDownRounded />
                )}
              </IconButton>
            </Tooltip>
          </Stack>
        </TableCell>

        <TableCell key="model" align="left">
          <Typography style={{ fontWeight: "bold" }}>
            {request.customerName}
          </Typography>
          <Typography variant="body2">{request.equipment[0]?.model}</Typography>
          <Typography variant="caption">
            {request.equipment?.length > 1
              ? `and ${request.equipment?.length - 1} more`
              : ""}
          </Typography>
        </TableCell>

        <TableCell key="status" align="left">
          <TransportUpdateDialog
            request={request}
            handleCloseConfirmDialog={handleCloseConfirmDialog}
            isShowingConfirmDialog={isShowingConfirmDialog}
            handleToggleConfirmDialog={handleToggleConfirmDialog}
            fullName={fullName}
            userProfile={userProfile}
            isShowingSpinner={isShowingSpinner}
            setIsShowingSpinner={setIsShowingSpinner}
          />
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

            {/* TODO update to transport PDF */}
            {/* <div>
              <Link
                target="_blank"
                rel="noopener noreferrer"
                to={"pdf"}
                onClick={setPDFData}
              >
                <IconButton aria-label="show">
                  <Tooltip title="Print">
                    <PrintOutlinedIcon />
                  </Tooltip>
                </IconButton>
              </Link>
            </div> */}

            <EditTransportView
              transportRequest={request}
              handleCloseEditTansportView={handleCloseEditTansportView}
              openAddTransportView={openAddTransportView}
              handleToggleEditTansportView={handleToggleEditTansportView}
            />

            <div className="delete-button">
              {isEditingWorkOrder ? (
                <IconButton
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
              <Typography variant="caption" gutterBottom component="div">
                {`Request ID: ${request.id} Work Order: ${request.workOrder}`}
              </Typography>
              <Typography variant="caption" gutterBottom component="div">
                {`Salesman: ${request.salesman}`}
              </Typography>
              <Table size="small" aria-label="equipment">
                <TransportEquipmentTableHeaderView />
                <TableBody>
                  {" "}
                  {request.equipment.map((item) => (
                    <TransportEquipmentRow
                      key={item?.id}
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

                      <TableCell key="addNotes">
                        <TextField
                          variant="outlined"
                          label="Notes"
                          size="small"
                          onChange={(e) => setNotes(e.target.value)}
                          value={notes}
                        ></TextField>
                      </TableCell>

                      <TableCell key="saveAddButton" align="center" >
                        <IconButton
                          style={{ fontSize: 20 }}
                          onClick={addEquipment}
                        >
                          {model !== "" && stock !== "" && serial !== "" ? (
                            <Tooltip title="Save">
                              <CheckRounded
                                color="primary"
                                style={{ fontSize: 18 }}
                              />
                            </Tooltip>
                          ) : (
                            <Tooltip title="Cancel">
                              <CloseRounded
                                color="error"
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
                    >
                      <TableCell key="addButtonCell">
                        <Tooltip title="Add Equipment">
                          <Button
                            startIcon={[<AddRounded />, <AgricultureRounded />]}
                            // TODO ucomment once this function is fixed
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
