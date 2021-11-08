import React, { useCallback, useEffect, useState } from 'react';
import { useStateValue } from '../StateManagement/StateProvider';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import { collection, query, where, orderBy, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { db } from '../Services/firebase';
import Button from '@mui/material/Button';
import { TableFooter, TextField, Tooltip, Typography } from '@material-ui/core';
import moment from 'moment';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import HomeSkeleton from '../Components/HomeSkeleton'
import '../Styles/Table.css'
import { Link } from 'react-router-dom';
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
import AddRequestView from '../Views/AddRequestView';
import { EquipmentTableHeaderView, RequestsTableHeaderView, } from '../Components/TableHeaderViews';
import { sendEquipmentUpdateEmail, sendWorkOrderEmail, sendNewEquipmentEmail, sendStatusEmail } from '../Services/EmailService'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import AgricultureIcon from '@mui/icons-material/Agriculture';

// Styles:
const useRowStyles = makeStyles({
  root: {
    '& > *': {
      borderBottom: 'unset',
    },
  },
});

// Equipment row view:
function EquipmentRow({request, item}) {
  const [{ userProfile }] = useStateValue();
  const classes = useRowStyles();
  var [model, setModel] = useState('')
  var [stock, setStock] = useState('');
  var [serial, setSerial] = useState('');
  var [work, setWork] = useState('');
  var [notes, setNotes] = useState('');
  const [currentValues, setCurrentValues] = useState({
    model: '',
    stock: '',
    serial: '',
    work: '',
    notes: ''
  });
  var [isEditingEquipment, setIsEditingEquipment] = useState(false);
  var [equipmentHasChanges, setEquipmentHasChanges] = useState(false);
  const fullName = `${userProfile?.firstName} ${userProfile?.lastName}`

  // Handles editing of the equipment values.
  // Either opens the edit textfields or sets new edits to firestore
  const editEquipment = async () => {

    // If isEditingEquipment is true,
    // check for changes to the equipment values
    if (isEditingEquipment) {

      var changeDetails = []

      // The model has changes
      if (currentValues.model !== model) {
        changeDetails.push(`equipment model updated from ${currentValues.model} to ${model}`)
      }

      // The stock number has changes
      if (currentValues.stock !== stock) {
        changeDetails.push(`equipment stock number updated from ${currentValues.stock} to ${stock}`)
      }

      // The serial number has changes
      if (currentValues.serial !== serial) {
        changeDetails.push(`equipment serial number updated from ${currentValues.serial} to ${serial}`)
      }

      // The work list has changes
      if (currentValues.work !== work) {
        changeDetails.push(`equipment work required updated from ${currentValues.work} to ${work}`)
      }

      // The notes have changes
      if (currentValues.notes !== notes) {
        changeDetails.push(`equipment notes from ${currentValues.notes === '' ? 'blank' : currentValues.notes} to ${notes}`)
      }

      // If the eaquipmentHasChanges check is true, 
      // set the values for the changLog, 
      // append the new changeLog object to the changeLog array, 
      // then set the new equipment values to the document in Firestore
      if (equipmentHasChanges) {

        const changeLogEntry = {
          user: fullName,
          change: changeDetails, 
          timestamp: moment().format("DD-MMM-yyyy hh:mmA")
        }

        item.changeLog.push(changeLogEntry)

        await setDoc(doc(db, 'branches', userProfile.branch, "requests", item.requestID, "equipment", item.stock), { 
          model: model,
          stock: stock,
          serial: serial,
          work: work,
          notes: notes,
          changeLog: item.changeLog
        }, { merge: true })

        sendEquipmentUpdateEmail(currentValues, request, request.salesman, userProfile, fullName, model, stock, serial, work, notes)
        setIsEditingEquipment(false)

      // if equipmentHasChanges check is false, 
      // do noting but set the isEditingEquipment Bool to false to close the Texfields and toggle the edit button
      } else {
        console.log("no changes to equipment")
        setIsEditingEquipment(false)
      }

    // If isEditingEquipment Bool is false, 
    // set firestore document values to state properties that update int he TextFields, 
    // and se tthe original values to an object so that we can check the TextField values for changes
    } else { 

      setCurrentValues({
        model: item.model,
        stock: item.stock,
        serial: item.serial,
        work: item.work,
        notes: item.notes
      })

      setModel(item.model)
      setStock(item.stock)
      setSerial(item.serial)
      setWork(item.work)
      setNotes(item.notes)
      setIsEditingEquipment(true)
    }
  }

  useEffect(() => {

    // Receives the changes on the equipment TextFields and 
    // sets the equipmentHasChanges Bool to true if 
    // current equipment TextField value doesn't match the original value loaded from Firestore 
    if (currentValues.model !== model || currentValues.stock !== stock || currentValues.serial !== serial || currentValues.work !== work || currentValues.notes !== notes) {

      setEquipmentHasChanges(true)
    } else {

      setEquipmentHasChanges(false)
    }
  }, [currentValues, model, stock, serial, work, notes, setEquipmentHasChanges])

  // Equipment row UI:
  return (

    <React.Fragment>
      <TableRow 
        key={item.requestID} 
        style={{ fontSize: 18 }} 
        className={classes.root} 
        sx={{ '& > *': { borderBottom: 'unset' } }}
      >
        
        <TableCell align="left" component="th" scope="row"> {
          isEditingEquipment 
          ? 
          <TextField 
            variant="outlined" 
            label="Model" 
            inputProps={{style: {fontSize: 14}}} 
            style={{ fontSize: 18 }} 
            size="small" 
            onChange={e=> setModel(e.target.value.toUpperCase())} 
            value={model}> 
          </TextField> 
          : 
          item.model
        }
        </TableCell>

        { isEditingEquipment 
          ?
          <TableCell align="left">
              <br/>
              <p>
                <TextField 
                  variant="outlined" 
                  label="Stock" 
                  inputProps={{style: {fontSize: 14}}} 
                  style={{ fontSize: 18 }} 
                  size="small" 
                  onChange={e=> setStock(e.target.value)} 
                  value={stock}>
                </TextField>
              </p>
              <br/>
              <p>
                <small>
                  <TextField 
                    variant="outlined" 
                    label="Serial" 
                    inputProps={{style: {fontSize: 14}}} 
                    style={{ fontSize: 18 }} 
                    size="small" 
                    onChange={e=> setSerial(e.target.value.toUpperCase())} 
                    value={serial}>
                  </TextField>
                </small>
              </p>
          </TableCell>
          :
          <TableCell align="left">
              { `Stock: ${item.stock}` }
              <p><small>{ `Serial: ${item.serial}` }</small></p>
          </TableCell>
        }

        <TableCell align="left">  {
          isEditingEquipment 
          ? 
          <TextField 
            variant="outlined" 
            label="Work" 
            inputProps={{style: {fontSize: 14}}} 
            style={{ fontSize: 18 }} 
            size="small" 
            onChange={e=> setWork(e.target.value)} 
            value={work}>
          </TextField> 
          : 
          item.work
        }
        </TableCell>

        <TableCell align="left"> {
          isEditingEquipment 
          ? 
          <TextField 
            variant="outlined" 
            label="Notes" 
            inputProps={{style: {fontSize: 14}}} 
            style={{ fontSize: 18 }} 
            size="small" 
            onChange={e=> setNotes(e.target.value)} 
            value={notes}>
          </TextField> 
          : 
          item.notes
        }
        </TableCell>
        
        <TableCell align="center">
          <IconButton 
            color="success" 
            style={{ fontSize: 20 }}
            onClick={editEquipment}> { 
              isEditingEquipment 
              ? 
              equipmentHasChanges
              ?
              <Tooltip title="Save">
                <CheckIcon 
                color="success" 
                style={{ fontSize: 18 }}/> 
              </Tooltip>
              :
              <Tooltip title="Cancel">
                <CloseIcon 
                  color="success" 
                  style={{ fontSize: 18 }}
                />
              </Tooltip>
              : 
              <Tooltip title="Edit Equipment">
                <EditRoundedIcon 
                color="success" 
                style={{ fontSize: 18 }}/> 
              </Tooltip>
            }
          </IconButton>
        </TableCell>
      </TableRow>
    </React.Fragment>
  )
}

// Request row view:
function Row({request}) {
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
        status = "Complete";
        break;

      default:
        status = "Complete";
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
      <TableRow key={request.id} className={classes.root}>

        <TableCell>
          <Tooltip title={open ? "Hide Equipment" : "Show Equipment"}>
            <IconButton 
              aria-label="expand row" 
              size="small" 
              onClick={() => setOpen(!open)}>
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </Tooltip>
        </TableCell>

        <TableCell align="left">
          <strong className="model">{equipment[0]?.model}</strong>
          <p><small>{equipment.length > 1 ? `and ${equipment.length - 1} more` : ""}</small></p>
        </TableCell>

        <TableCell component="th" scope="row" >
          <p>{request.salesman}</p>
          <small>{request.timestamp}</small>
        </TableCell>        
        
        <TableCell align="left"> {
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
        
        <TableCell align="left">
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
        
        <TableCell align="right">
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

      <TableRow>
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
                    <EquipmentRow key={item?.stock} request={request} item={item} />
                  ))
                }
                  { isShowingAddEquipment 
                    ?  
                    <TableRow 
                      key={request.id} 
                      style={{ fontSize: 18 }} 
                      className={classes.root} 
                      sx={{ '& > *': { borderBottom: 'unset' } }}
                    >

                      <TableCell  component="th" scope="row">
                        <TextField 
                          variant="outlined" 
                          label="Model" 
                          inputProps={{style: {fontSize: 14}}} 
                          size="small" 
                          onChange={e=> setModel(e.target.value.toUpperCase())} 
                          value={model}>
                        </TextField>
                      </TableCell>

                      <TableCell>
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

                      <TableCell> 
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

                      <TableCell>
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

                      <TableCell align="center">
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
                </TableBody> { 
                  !isShowingAddEquipment
                  ?
                  <TableFooter>
                    <TableRow key="addButton" style={{ fontSize: 18 }} className={classes.root} sx={{ '& > *': { borderBottom: 'unset' } }}>
                      <TableCell>
                        <Tooltip title="Add Equipment">
                          <Button startIcon={[<AddIcon />, <AgricultureIcon/>]} color="success" onClick={addEquipment}></Button>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                  :
                  null
                }
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

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
  const fetch = useCallback( async ()=> {
    const requestsQuery = query(
        collection(db, 'branches', userProfile?.branch, 'requests'),
        where('status', '!=', 'Completed')
    );
    
    onSnapshot(requestsQuery, (querySnapshot) => {
        setRequests(querySnapshot.docs.map((doc) => ({
          id: doc.data().id,
          salesman: doc.data().salesman,
          timestamp: doc.data().timestamp,
          workOrder: doc.data().workOrder,
          status: doc.data().status,
          statusTimestamp: doc.data().statusTimestamp,
          changeLog: doc.data().changeLog
        })))
    });
  }, [userProfile?.branch])

  useEffect(() => {
    fetch()
    setTimeout( function() { setLoading(false) }, 1000)
  }, [fetch])

  // Table UI:
  return (
    <React.Fragment>

      { loading 
        ? 
        <HomeSkeleton /> 
        : 
        <div className="tableHead">
          <Typography 
            variant="h4" 
            color='primary' 
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
      }

          <Dialog onClose={handleCloseAddRequestView} open={openAddRequestView}>
            <div className="closeButtonContainer">
              <Button onClick={handleCloseAddRequestView} color="success">
                <CancelOutlinedIcon/>
              </Button>
            </div>
            <div className="addRequestView">
              <AddRequestView />
            </div>
          </Dialog>

      <TableContainer component={Paper} 
      style={{ borderRadius: 10 }}
      >
        <Table  size="small"aria-label="collapsible table" style={{ margin: 15 }} sx={{ paddingTop: 2 }}>
          <RequestsTableHeaderView />
          <TableBody>
            {requests.map(request => (
              <Row request={request} />
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
  );
};