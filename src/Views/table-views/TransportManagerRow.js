import React, { useState } from "react";
import { useStateValue } from "../../state-management/StateProvider";
import { setDoc, doc } from "firebase/firestore";
import { db } from "../../services/firebase";
import moment from "moment";
import "../../styles/Table.css";
import { TransportEquipmentTableHeaderView } from "../../components/TableHeaderViews";
import { sendNewTransportEquipmentEmail } from "../../services/email-service";
import { Link } from "react-router-dom";
import TransportEquipmentRow from "./TransportEquipmentRows";
import TransportUpdateDialog from "../TransportUpdateDialog";
import EditTransportView from "../EditTransportView";
import {
  Alert,
  Box,
  Button,
  Card,
  Collapse,
  Divider,
  Dialog,
  DialogTitle,
  IconButton,
  Snackbar,
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
  CheckRounded,
  CloseRounded,
  ContentCopyRounded,
  HistoryOutlined,
  KeyboardArrowDownRounded,
  KeyboardArrowUpRounded,
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
export default function TransportRow(props) {
  //#region State Properties
  const { request, cardMode = false } = props;
  const [{ userProfile }] = useStateValue();
  const [open, setOpen] = useState(false);
  const [openCustomerInfo, setOpenCustomerInfo] = useState(false);
  var [model, setModel] = useState("");
  var [stock, setStock] = useState("");
  var [serial, setSerial] = useState("");
  var [notes, setNotes] = useState("");
  var [isShowingAddEquipment, setIsShowingAddEquipment] = useState(false);
  const fullName = `${userProfile?.firstName} ${userProfile?.lastName}`;
  const [openChangeLog, setOpenChangeLog] = useState(false);
  const [isShowingConfirmDialog, setIsShowingConfirmDialog] = useState(false);
  const [isShowingSpinner, setIsShowingSpinner] = useState(false);
  const [copyLinkSnackbarOpen, setCopyLinkSnackbarOpen] = useState(false);
  
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
  const setPDFData = () => {
    const requestRef = doc(db, "users", userProfile?.id, "pdf", "pdfData");
    setDoc(
      requestRef,
      {
        request: request,
      },
      {
        merge: true,
      }
    );
  };

  const copyCustomerLink = async () => {
    if (!request.customerAccessLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(request.customerAccessLink);
      setCopyLinkSnackbarOpen(true);
    } catch (error) {
      window.open(request.customerAccessLink, "_blank", "noopener,noreferrer");
    }
  };

  // Request row UI:
  if (cardMode) {
    return (
      <React.Fragment>
        <Card sx={{ p: 1.25 }}>
          <Stack spacing={0.85}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr auto auto" },
                gap: 0.9,
                alignItems: "start",
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {request.type}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  {`WO#: ${request.workOrder || "-"}`}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {request.equipment?.[0]?.model || "-"}
                  {request.equipment?.length > 1
                    ? ` and ${request.equipment.length - 1} more`
                    : ""}
                </Typography>
              </Box>

              <Box sx={{ justifySelf: { xs: "start", sm: "center" } }}>
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
              </Box>

              <Stack direction="row" spacing={0.25} justifySelf={{ xs: "start", sm: "end" }}>
                <IconButton aria-label="show changes" onClick={handleToggleChangeLog} size="small">
                  <Tooltip title="Show Changes">
                    <HistoryOutlined />
                  </Tooltip>
                </IconButton>
                <Link
                  target="_blank"
                  rel="noopener noreferrer"
                  to={"transport-pdf"}
                  onClick={setPDFData}
                >
                  <IconButton aria-label="print request" size="small">
                    <Tooltip title="Print">
                      <PrintOutlined />
                    </Tooltip>
                  </IconButton>
                </Link>
                <EditTransportView transportRequest={request} />
              </Stack>

              <Box
                sx={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, whiteSpace: "normal", wordBreak: "break-word" }}
                >
                  {request.name}
                </Typography>
                {request.customerAccessLink ? (
                  <Stack direction="row" spacing={0.25} alignItems="center" sx={{ flexShrink: 0 }}>
                    <Button
                      size="small"
                      variant="text"
                      component="a"
                      href={request.customerAccessLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ px: 0.5, minWidth: 0, whiteSpace: "nowrap" }}
                    >
                      Customer View
                    </Button>
                    <IconButton
                      size="small"
                      aria-label="Copy customer view link"
                      onClick={copyCustomerLink}
                    >
                      <ContentCopyRounded fontSize="inherit" />
                    </IconButton>
                  </Stack>
                ) : null}
              </Box>
            </Box>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={0.75}
              justifyContent="flex-start"
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Button
                size="small"
                variant="text"
                startIcon={openCustomerInfo ? <KeyboardArrowUpRounded /> : <KeyboardArrowDownRounded />}
                onClick={() => setOpenCustomerInfo((previous) => !previous)}
                sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
              >
                {openCustomerInfo ? "Hide Customer Info" : "Show Customer Info"}
              </Button>
              <Button
                size="small"
                variant="text"
                startIcon={open ? <KeyboardArrowUpRounded /> : <KeyboardArrowDownRounded />}
                onClick={() => setOpen(!open)}
                sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
              >
                {open ? "Hide Equipment" : "Show Equipment"}
              </Button>
            </Stack>

          </Stack>

          <Collapse in={openCustomerInfo} timeout="auto" unmountOnExit>
            <Divider sx={{ my: 1 }} />
            <Stack spacing={0.35}>
              <Typography variant="caption" color="text.secondary">
                {`Customer: ${request.name || "-"}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {`Phone: ${request.phone || "-"}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {`Address: ${request.street || "-"}, ${request.city || "-"}, ${request.state || "-"} ${request.zip || "-"}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {`Requested Date: ${request.requestedDate || "-"}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {`Status Updated: ${request.statusTimestamp || "-"}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {`Notes: ${request.notes || "-"}`}
              </Typography>
            </Stack>
          </Collapse>

          <Collapse in={open} timeout="auto" unmountOnExit>
            <Divider sx={{ my: 1 }} />
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                {`Request ID: ${request.id}`}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                {`Created By: ${request.salesman}`}
              </Typography>
              <Table size="small" aria-label="equipment">
                <TransportEquipmentTableHeaderView />
                <TableBody>
                  {request.equipment.map((item) => (
                    <TransportEquipmentRow key={item?.id} request={request} item={item} />
                  ))}
                </TableBody>
                <TableFooter>
                  {isShowingAddEquipment ? (
                    <TableRow key="addEquipmentRow" sx={{ "& > *": { borderBottom: "unset" } }}>
                      <TableCell key="addModel" component="th" scope="row">
                        <TextField
                          variant="outlined"
                          label="Model"
                          size="small"
                          onChange={(e) => setModel(e.target.value.toUpperCase())}
                          value={model}
                        />
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
                          />
                        </p>
                        <br />
                        <p>
                          <TextField
                            variant="outlined"
                            label="Serial"
                            size="small"
                            onChange={(e) => setSerial(e.target.value.toUpperCase())}
                            value={serial}
                          />
                        </p>
                      </TableCell>

                      <TableCell key="addNotes">
                        <TextField
                          variant="outlined"
                          label="Notes"
                          size="small"
                          onChange={(e) => setNotes(e.target.value)}
                          value={notes}
                        />
                      </TableCell>

                      <TableCell key="saveAddButton" align="center">
                        <IconButton style={{ fontSize: 20 }} onClick={addEquipment}>
                          {model !== "" && stock !== "" && serial !== "" ? (
                            <Tooltip title="Save">
                              <CheckRounded color="primary" style={{ fontSize: 18 }} />
                            </Tooltip>
                          ) : (
                            <Tooltip title="Cancel">
                              <CloseRounded color="error" style={{ fontSize: 18 }} />
                            </Tooltip>
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {!isShowingAddEquipment ? (
                    <TableRow key="addButtonRow" sx={{ "& > *": { borderBottom: "unset" } }}>
                      <TableCell key="addButtonCell">
                        <Tooltip title="Add Equipment">
                          <Button
                            startIcon={[<AddRounded />, <AgricultureRounded />]}
                            onClick={addEquipment}
                          />
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableFooter>
              </Table>
            </Box>
          </Collapse>
        </Card>

        <Dialog onClose={handleCloseChangeLog} open={openChangeLog}>
          <DialogTitle>Request Change History</DialogTitle>
          <Timeline position="alternate">
            {request.changeLog.map((change, index) => (
              <TimelineItem key={index}>
                <TimelineSeparator>
                  <TimelineDot variant="outlined" color="primary" />
                  {request.changeLog.indexOf(change) + 1 !== request.changeLog.length ? (
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

        <Snackbar
          open={copyLinkSnackbarOpen}
          autoHideDuration={2200}
          onClose={() => setCopyLinkSnackbarOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity="success" onClose={() => setCopyLinkSnackbarOpen(false)}>
            Customer link copied
          </Alert>
        </Snackbar>
      </React.Fragment>
    );
  }

  // Request row UI:
  return (
    <React.Fragment>
      <TableRow
        key={request.equipment.id}
        sx={{ '& > *': { borderBottom: 'unset' } }}
      >
        <TableCell key="expand">
          <Stack alignItems="start">
            <Typography variant="h6">{request.type}</Typography>
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
          <Stack
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              width: "100%",
            }}
          >
            <Typography
              style={{
                fontWeight: "bold",
                whiteSpace: "normal",
                wordBreak: "break-word",
              }}
            >
              {request.name}
            </Typography>
            {request.customerAccessLink ? (
              <Stack
                direction="row"
                spacing={0.25}
                alignItems="center"
                sx={{ pl: 0.5, flexShrink: 0 }}
              >
                <Button
                  size="small"
                  variant="text"
                  component="a"
                  href={request.customerAccessLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ px: 0.5, minWidth: 0, whiteSpace: "nowrap" }}
                >
                  Customer View
                </Button>
                <IconButton
                  size="small"
                  aria-label="Copy customer view link"
                  onClick={copyCustomerLink}
                >
                  <ContentCopyRounded fontSize="inherit" />
                </IconButton>
              </Stack>
            ) : null}
          </Stack>
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

            {/* TODO update to transport PDF */}
            <div>
              <Link
                target="_blank"
                rel="noopener noreferrer"
                to={"transport-pdf"}
                onClick={setPDFData}
              >
                <IconButton aria-label="show">
                  <Tooltip title="Print">
                    <PrintOutlined />
                  </Tooltip>
                </IconButton>
              </Link>
            </div>

            <EditTransportView
              transportRequest={request}
            />
          </div>

          
        </TableCell>
      </TableRow>

      <Snackbar
        open={copyLinkSnackbarOpen}
        autoHideDuration={2200}
        onClose={() => setCopyLinkSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setCopyLinkSnackbarOpen(false)}>
          Customer link copied
        </Alert>
      </Snackbar>

      <TableRow key="equipmentRow">
        <TableCell
          key="equipmentCell"
          style={{ paddingBottom: 0, paddingTop: 0 }}
          colSpan={6}
        >
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="caption" gutterBottom component="div">
                {`Request ID: ${request.id}`}
              </Typography>
              <Typography variant="caption" gutterBottom component="div">
                {`Created By: ${request.salesman}`}
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
