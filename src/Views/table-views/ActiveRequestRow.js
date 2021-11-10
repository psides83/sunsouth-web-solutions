import React, { useCallback, useEffect, useState } from 'react';
import { useStateValue } from '../../state-management/StateProvider';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import { collection, query, orderBy, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import Button from '@mui/material/Button';
import { TableFooter, TextField, Tooltip, Typography } from '@material-ui/core';
import moment from 'moment';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import '../../styles/Table.css'
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import { EquipmentTableHeaderView } from '../../components/TableHeaderViews';
import { sendWorkOrderEmail, sendNewEquipmentEmail, sendStatusEmail } from '../../services/EmailService'
import AgricultureIcon from '@mui/icons-material/Agriculture';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import { RequestDetails } from '../../components/RequestDetails';
import EquipmentRow from './EquipmentRows';

// Styles:
const useRowStyles = makeStyles({
    root: {
      '& > *': {
        borderBottom: 'unset',
      },
    },
  });

// Request row view:
export default function RequestRow({request}) {
    const [{ userProfile }] = useStateValue();
    const [open, setOpen] = useState(false);
    const classes = useRowStyles();
    var [workOrder, setWorkOrder] = useState('');
    var [currentWorkOrder, setCurrentWorkOrder] = useState('');
    var [equipment, setEquipment] = useState([]);
    var [model, setModel] = useState('')
    var [stock, setStock] = useState('');
    var [serial, setSerial] = useState('');
    var [work, setWork] = useState('');
    var [notes, setNotes] = useState('');
    var [isEditingWorkOrder, setIsEditingWorkOrder] = useState(false);
    var [isShowingAddEquipment, setIsShowingAddEquipment] = useState(false);
    var [workOrderHasChanges, setWorkOrderHasChanges] = useState(false);
    const fullName = `${userProfile?.firstName} ${userProfile?.lastName}`
    const [openChangeLog, setOpenChangeLog] = useState(false);
  
    const handleCloseChangeLog = () => {
      setOpenChangeLog(false);
    };
    const handleToggleChangeLog = () => {
      setOpenChangeLog(!openChangeLog);
    };
  
    // Fetches equipment from firestore:
    const fetchEquipment = useCallback( ()=> {
      const equipmentQuery = query(
          collection(db, 'branches', userProfile?.branch, "requests", request.id, 'equipment'),
          orderBy('timestamp', 'asc')
      );
      
      onSnapshot(equipmentQuery, (querySnapshot) => {
          setEquipment(querySnapshot.docs.map((doc) => ({
            requestID: doc.data().requestID,
            model: doc.data().model.toString().toUpperCase(),
            stock: doc.data().stock,
            serial: doc.data().serial.toString().toUpperCase(),
            work: doc.data().work,
            notes: doc.data().notes,
            changeLog: doc.data().changeLog
          })))
      });
    }, [request.id, userProfile.branch])
  
    useEffect(() => {
  
      // Checks for changes in workOrder value and updates state
      if (currentWorkOrder !== workOrder) {
  
        setWorkOrderHasChanges(true)
      } else {
  
        setWorkOrderHasChanges(false)
      }
      
      // Fetch equipment data from firestore
      fetchEquipment()
    }, [fetchEquipment, currentWorkOrder, workOrder, isShowingAddEquipment, setWorkOrderHasChanges])
  
    // Handles adding or editing the work order number for the request:
    const editWorkOrder = async () => {
      if (isEditingWorkOrder) { 
  
        if (workOrderHasChanges) {
          
          const workOrderStatus = request.workOrder === '' ? `Added WO # ${workOrder}` : `WO # updated from ${request.workOrder} to ${workOrder}`
  
          const changeLogEntry = {
            user: fullName,
            change: workOrderStatus, 
            timestamp: moment().format("DD-MMM-yyyy hh:mmA")
          }
          
          if (request.workOrder !== workOrder) {
  
            request.changeLog.push(changeLogEntry)
          }
  
          await setDoc(doc(db, 'branches', userProfile.branch, "requests", request.id), { workOrder: workOrder, changeLog: request.changeLog }, { merge: true })
          sendWorkOrderEmail(equipment, request, workOrder, fullName, model, userProfile, request.salesman)
          setIsEditingWorkOrder(false)
        } else {
  
          console.log("no changes to equipment")
          setIsEditingWorkOrder(false)
        }
      } else { 
  
        setWorkOrder(request.workOrder)
        setCurrentWorkOrder(request.workOrder)
        setIsEditingWorkOrder(true)
      }
    }
  
    // Handles adding equipment to the request:
    const addEquipment = async () => {
  
      const timestamp = moment().format("DD-MMM-yyyy hh:mmA") 
  
      if(isShowingAddEquipment) {
  
        if(model !== '' && stock !== '' && serial !== '' && work !== '') {
  
          const changeLog = [{
            user: fullName,
            change: `request created`,
            timestamp: timestamp
          }]
  
          const equipment = {
            requestID: request.id,
            timestamp: timestamp,
            model: model,
            stock: stock,
            serial: serial,
            work: work,
            notes: notes,
            changeLog: changeLog
          }
          
          // Sets the added equipment to firestore:
          const equipmentRef = doc(db, 'branches',  userProfile.branch, 'requests', request.id, 'equipment', equipment.stock);
          await setDoc(equipmentRef, equipment, { merge: true });
  
          // Append the equipment addition to the request's changealog
          const changeLogEntry = {
            user: fullName,
            change: `Equipment model ${model} added to the request`, 
            timestamp: moment().format("DD-MMM-yyyy hh:mmA")
          }
      
          request.changeLog.push(changeLogEntry)
  
          const requestRef = doc(db, 'branches',  userProfile.branch, 'requests', request.id);
          await setDoc(requestRef, { changeLog: request.changeLog }, { merge: true });
  
          // Send email about addition of equipment
          sendNewEquipmentEmail(request, equipment, timestamp, fullName, model, stock, serial, work, notes, userProfile, request.salesman)
          // Hides add equipment TextFields
          setIsShowingAddEquipment(false)
          setEquipment([])
          setModel('')
          setStock('')
          setSerial('')
          setWork('')
          setNotes('')
        } else {
  
          setIsShowingAddEquipment(false)
        }
      } else {
  
        setIsShowingAddEquipment(true)
      }
    }
  
    // Handles updating the request status:
    const updateStatus = async () => {
      var status = request.status
  
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
        timestamp: moment().format("DD-MMM-yyyy hh:mmA")
      }
  
      request.changeLog.push(changeLogEntry)
      const requestRef = doc(db, 'branches',  userProfile.branch, 'requests', request.id);
      await setDoc(requestRef, { 
  
        status: status, 
        statusTimestamp: moment().format("DD-MMM-yyyy h:mmA"), 
        changeLog: request.changeLog 
      }, { 
        
        merge: true 
      });
  
      sendStatusEmail(status, equipment, request, fullName, userProfile, request.salesman)
    }
  
    // Request row UI:
    return (
      <React.Fragment>
        <TableRow key={equipment.requestID} className={classes.root}>
  
          <TableCell key="expand">
            <Tooltip title={open ? "Hide Equipment" : "Show Equipment"}>
              <IconButton 
                aria-label="expand row" 
                size="small" 
                onClick={() => setOpen(!open)}>
                {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
              </IconButton>
            </Tooltip>
          </TableCell>
  
          <TableCell key="model" align="left">
            <strong className="model">{equipment[0]?.model}</strong>
            <p><small>{equipment.length > 1 ? `and ${equipment.length - 1} more` : ""}</small></p>
          </TableCell>
  
          <TableCell key='salesman' component="th" scope="row" >
            <p>{request.salesman}</p>
            <small>{request.timestamp}</small>
          </TableCell>        
          
          <TableCell key='workOrder' align="left"> {
            isEditingWorkOrder 
            ? 
            <TextField 
              variant="outlined" 
              label="Work Order"
              inputProps={{style: {fontSize: 14}}} 
              size="small" 
              onChange={e=> setWorkOrder(e.target.value)} 
              value={workOrder}> 
            </TextField> 
            : 
            request.workOrder
          }
          </TableCell>
          
          <TableCell key='status' align="left">
                <Tooltip title="Update Status">
                  <Button 
                    color="success" 
                    size="small" 
                    sx={{ width: '115px', pt: '5px' }}
                    variant={request.status === 'In Progress' ? "contained" : "outlined"} 
                    onClick={updateStatus}
                  >
                    { request.status }
                  </Button>
                </Tooltip>
                <p><small>{request.statusTimestamp}</small></p>
          </TableCell>
          
          <TableCell key='buttons' align="right">
            <div className="cellButtons">
  
              <div>
                <IconButton aria-label="show" onClick={handleToggleChangeLog}>
                  <Tooltip title="Show Changes">
                    <HistoryOutlinedIcon />
                  </Tooltip>
                </IconButton>
                <Dialog onClose={handleCloseChangeLog} open={openChangeLog}>
                  <DialogTitle>Request Change History</DialogTitle>
                  <Timeline position="alternate"> { 
                    request.changeLog.map((change) => (
                      <TimelineItem>
                        <TimelineSeparator >
                          <TimelineDot variant="outlined" color="success"/>
                          {request.changeLog.indexOf(change) + 1 !== request.changeLog.length ? <TimelineConnector /> : null}
                        </TimelineSeparator>
                        <TimelineContent>
                          <p><small>{change.timestamp}</small></p>
                          <small>{change.user}</small>
                          <p><small>{change.change}</small></p>
                        </TimelineContent>
                      </TimelineItem>
                    ))
                  }
                  </Timeline>
                </Dialog>
              </div>
  
              <div>
                <PDFDownloadLink document={<RequestDetails request={request} equipment={equipment} />} fileName="request-details.pdf">
                  {({ blob, url, loading, error }) =>
                    loading ? 'Loading document...' : 
                    <IconButton aria-label="show">
                      <Tooltip title="Print">
                        <PrintOutlinedIcon />
                      </Tooltip>
                    </IconButton>
                  }
                </PDFDownloadLink>
                
              </div>
  
              <div className="editIcon">
                <IconButton 
                  className={classes.icon}
                  onClick={editWorkOrder}> {
                    isEditingWorkOrder 
                    ? 
                    workOrderHasChanges
                    ?
                    <Tooltip title="Save">
                      <CheckIcon color="success" style={{ fontSize: 18 }}/> 
                    </Tooltip>
                    :
                    <Tooltip title="Cancel">
                      <CloseIcon 
                        color="success" 
                        style={{ fontSize: 18 }}
                      />
                    </Tooltip> 
                    : 
                    <div className="edit-button-bg">  
                      <Tooltip title="Edit Work Order">
                        <EditRoundedIcon color="success" style={{ fontSize: 16 }} />
                      </Tooltip>
                    </div>
                  }
                </IconButton>
              </div>
            </div>
          </TableCell>
        </TableRow>
  
        <TableRow key='addEquipment'>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box margin={1}>
                <Typography variant="subtitle1" gutterBottom component="div">
                  {`Request ID: ${request.id}`}
                </Typography>
                <Table size="small" aria-label="equipment">
                <EquipmentTableHeaderView />
                  <TableBody> { 
                    equipment.map((item) => (
                      <EquipmentRow key={item?.stock} classes={classes} request={request} item={item} />
                    ))
                  }
                  </TableBody>
                  <TableFooter>
                    { isShowingAddEquipment 
                      ?  
                      <TableRow 
                        key='addEquipmentCells' 
                        style={{ fontSize: 18 }} 
                        className={classes.root} 
                        sx={{ '& > *': { borderBottom: 'unset' } }}
                      >
  
                        <TableCell key='model'  component="th" scope="row">
                          <TextField 
                            variant="outlined" 
                            label="Model" 
                            inputProps={{style: {fontSize: 14}}} 
                            size="small" 
                            onChange={e=> setModel(e.target.value.toUpperCase())} 
                            value={model}>
                          </TextField>
                        </TableCell>
  
                        <TableCell key='ids'>
                          <br/>
                          <p>
                            <TextField 
                              variant="outlined" 
                              label="Stock" 
                              inputProps={{style: {fontSize: 14}}} 
                              size="small" 
                              onChange={e=> setStock(e.target.value)} 
                              value={stock}
                            >
                            </TextField> 
                          </p>
                          <br/>
                          <p>
                            <TextField 
                              variant="outlined"
                              label="Serial"
                              inputProps={{style: {fontSize: 14}}} 
                              size="small" 
                              onChange={e=> setSerial(e.target.value.toUpperCase())} 
                              value={serial}
                            >
                            </TextField>
                          </p> 
                        </TableCell>
  
                        <TableCell key='work'> 
                          <TextField 
                            variant="outlined" 
                            label="Work" 
                            inputProps={{style: {fontSize: 14}}} 
                            size="small" 
                            onChange={e=> setWork(e.target.value)} 
                            value={work}
                          > 
                          </TextField> 
                        </TableCell>
  
                        <TableCell key='notes'>
                          <TextField 
                            variant="outlined" 
                            label="Notes" 
                            inputProps={{style: {fontSize: 14}}} 
                            style={{ fontSize: 18 }} 
                            size="small" 
                            onChange={e=> setNotes(e.target.value)} 
                            value={notes}
                          >
                          </TextField> 
                        </TableCell>
  
                        <TableCell key='button' align="center">
                          <IconButton 
                            style={{ fontSize: 20 }}
                            onClick={addEquipment}> { 
                              model !== '' && stock !== '' && serial !== '' && work !== '' 
                              ?
                              <Tooltip title="Save">
                                <CheckIcon color="success" style={{ fontSize: 18 }} />
                              </Tooltip>
                              :
                              <Tooltip title="Cancel">
                                <CloseIcon color="success" style={{ fontSize: 18 }} />
                              </Tooltip>
                            }   
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      :
                      null
                    }
                   { 
                    !isShowingAddEquipment
                    ?
                      <TableRow key="addButton" style={{ fontSize: 18 }} className={classes.root} sx={{ '& > *': { borderBottom: 'unset' } }}>
                        <TableCell>
                          <Tooltip title="Add Equipment">
                            <Button startIcon={[<AddIcon />, <AgricultureIcon/>]} color="success" onClick={addEquipment}></Button>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    :
                    null
                  }
                  </TableFooter>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </React.Fragment>
    );
  }