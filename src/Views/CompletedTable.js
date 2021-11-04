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
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import { collection, query, where, orderBy, onSnapshot, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '../Services/firebase';
import Button from '@mui/material/Button';
import { MenuItem, TextField, Tooltip, Typography } from '@material-ui/core';
import moment from 'moment';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import HomeSkeleton from '../Components/HomeSkeleton'
import '../Styles/Table.css'
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import emailjs from 'emailjs-com'

const useRowStyles = makeStyles({
  root: {
    '& > *': {
      borderBottom: 'unset',
    },
  },
});

const useStyles = makeStyles((theme) => ({
  select: {
    marginRight: '50px',
    marginLeft: '25px',
    marginBottom: '10px',
    width: '110px',

    '&:before': {
        borderColor: theme.palette.secondary.main,
    },
    '&:after': {
        borderColor: theme.palette.secondary.main,
    },
    '&:not(.Mui-disabled):hover::before': {
        borderColor: theme.palette.secondary.main,
    },
  },
}));

// Equipment row view:
function EquipmentRow({item}) {
  const [{ userProfile }] = useStateValue();
  const classes = useRowStyles();
  var [model, setModel] = useState('')
  var [stock, setStock] = useState('');
  var [serial, setSerial] = useState('');
  var [work, setWork] = useState('');
  var [notes, setNotes] = useState('');
  var [isEditingEquipment, setIsEditingEquipment] = useState(false);
  
  // Handles editing of the equipment values. either opens the edit textfields or sets new edits to firestore:
  const editEquipment = async () => {
    if (isEditingEquipment) { 

      await setDoc(doc(db, 'branches', userProfile.branch, "requests", item.requestID, "equipment", item.stock), { 
        model: model,
        stock: stock,
        serial: serial,
        work: work,
        notes: notes
      }, { merge: true })

      setIsEditingEquipment(false)
    } else { 

      setModel(item.model)
      setStock(item.stock)
      setSerial(item.serial)
      setWork(item.work)
      setNotes(item.notes)
      setIsEditingEquipment(true)
    }
  }

  // Equipment row UI:
  return (
    <React.Fragment>
      <TableRow key={item.requestID} style={{ fontSize: 18 }} className={classes.root} sx={{ '& > *': { borderBottom: 'unset' } }}>

        <TableCell align="left" component="th" scope="row">
          {isEditingEquipment ? <TextField variant="outlined" label="Model" inputProps={{style: {fontSize: 14}}} style={{ fontSize: 18 }} size="small" onChange={e=> setModel(e.target.value.toUpperCase())} value={model}> </TextField> : item.model}
        </TableCell> {
          isEditingEquipment 
          ?
          <TableCell align="left">
              <br/>
              <p><TextField variant="outlined" label="Stock" inputProps={{style: {fontSize: 14}}} style={{ fontSize: 18 }} size="small" onChange={e=> setStock(e.target.value)} value={stock}> </TextField></p>
              <br/>
              <p><small><TextField variant="outlined" label="Serial" inputProps={{style: {fontSize: 14}}} style={{ fontSize: 18 }} size="small" onChange={e=> setSerial(e.target.value.toUpperCase())} value={serial}> </TextField></small></p>
          </TableCell>
          :
          <TableCell align="left">
              { item.stock }
              <p><small>{ item.serial }</small></p>
          </TableCell>
        }

        <TableCell align="left"> {
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
              <Tooltip title="Save">
                <CheckIcon 
                color="success" 
                style={{ fontSize: 18 }}/> 
              </Tooltip>
              : 
              <Tooltip title="Edit">
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
  // const [activeRequest, setActiveRequest] = useState({});
  const classes = useRowStyles();
  // const history = useHistory();
  var [workOrder, setWorkOrder] = useState('');
  var [equipment, setEquipment] = useState([]);
  var [model, setModel] = useState('')
  var [stock, setStock] = useState('');
  var [serial, setSerial] = useState('');
  var [work, setWork] = useState('');
  var [notes, setNotes] = useState('');
  var [isEditingWorkOrder, setIsEditingWorkOrder] = useState(false);
  var [isShowingAddEquipment, setIsShowingAddEquipment] = useState(false);
  const fullName = userProfile?.firstName + ' ' + userProfile?.lastName

  // Fetches equipment from firestore:
  const fetchEquipment = useCallback( ()=> {
    const equipmentQuery = query(
        collection(db, 'branches', userProfile?.branch, "requests", request.id, 'equipment'),
        // where('requestID', '==', request.id)
    );
    
    onSnapshot(equipmentQuery, (querySnapshot) => {
        setEquipment(querySnapshot.docs.map((doc) => ({
          requestID: doc.data().requestID,
          model: doc.data().model,
          stock: doc.data().stock,
          serial: doc.data().serial,
          work: doc.data().work,
          notes: doc.data().notes,
          changeLog: doc.data().changeLog
        })))
    });
  }, [request.id, userProfile.branch])

  useEffect(() => {
    fetchEquipment()
  }, [fetchEquipment])

  // Sends email when work order number is added or updated:
  const sendWorkOrderEmail = (workOrder) => {

    // creates the paramaters for the email template:
    const timestamp = moment().format("DD-MMM-yyyy hh:mmA")
    const recipients = "mallen@sunsouth.com, svcwriter11@sunsouth.com, parts11@sunsouth.com"
    const subject = `UPDATED - request on model ${equipment[0]?.model}, ${equipment[0]?.stock}`
    const body = `<body>
                    <p>${timestamp}</p><br>
                    <p>Work order # ${workOrder} has been added or updated by ${fullName} to the request on ${model} ${equipment[0]?.model}, ST# ${equipment[0]?.stock}.</p>
                  <body>`

    // Sets paramaters for the email template:
    const templateParams = {
      to: userProfile.email,
      replyTo: userProfile.email, 
      from: "PDI/Setup Requests", 
      copy: userProfile.email,
      subject: subject,
      message: body
    }

    // sends thw email:
    emailjs.send('service_5guvozs', 'template_5dg1ys6', templateParams, 'user_3ub5f4KJJHBND1Wzl1FQi')
  }

  // Handles adding or editing the work order number for the request:
  const editWorkOrder = async () => {
    if (isEditingWorkOrder) { 

      const workOrderStatus = request.workOrder === '' ? `Added work order ${workOrder}` : `Work order updated from ${request.workOrder} to ${workOrder}`

      const changeLogEntry = {
        user: fullName,
        change: workOrderStatus, 
        timestamp: moment().format("DD-MMM-yyyy hh:mmA")
      }
      
      if (request.workOrder !== workOrder) {
      request.changeLog.push(changeLogEntry)
    }

      await setDoc(doc(db, 'branches', userProfile.branch, "requests", request.id), { workOrder: workOrder, changeLog: request.changeLog }, { merge: true })
      sendWorkOrderEmail(workOrder)
      setIsEditingWorkOrder(false)
    } else { 
      setWorkOrder(request.workOrder)
      setIsEditingWorkOrder(true)
    }
  }

  // Handles adding equipment to the request:
  const addEquipment = async () => {
     
    if(isShowingAddEquipment) {

      if(model !== '' && stock !== '' && serial !== '' && work !== '') {
        const equipment = {

          requestID: request.id,
          model: model,
          stock: stock,
          serial: serial,
          work: work,
          notes: notes
        }
        
        // Sets the added equipment to firestore:
        const equipmentRef = doc(db, 'branches',  userProfile.branch, 'requests', request.id, 'equipment', equipment.stock);
        await setDoc(equipmentRef, equipment, { merge: true });
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

  // Send email when request status is updated:
  const sendStatusEmail = async (status) => {

    const timestamp = moment().format("DD-MMM-yyyy hh:mmA")
    const recipients = "mallen@sunsouth.com, svcwriter11@sunsouth.com, parts11@sunsouth.com"
    const subject = `UPDATED - Status updated to ${status} for model ${equipment[0]?.model}, ${equipment[0]?.stock}`
    const body = `<body>
                    <p>${timestamp}</p><br> 
                    <p>Status of ${equipment[0]?.model} ST# ${equipment[0]?.stock} has been updated by ${fullName} to ${status}.</p> 
                  <body>`

    const templateParams = {
      to: userProfile.email,
      replyTo: userProfile.email, 
      from: "PDI/Setup Requests", 
      copy: userProfile.email,
      subject: subject,
      message: body
    }

    await emailjs.send('service_5guvozs', 'template_5dg1ys6', templateParams, 'user_3ub5f4KJJHBND1Wzl1FQi')
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
      statusTimestamp: moment().format("DD-MMM-yyyy"), 
      changeLog: request.changeLog 
    }, { 
      
      merge: true 
    });

    sendStatusEmail(status)
  }

  // Request row UI:
  return (
    <React.Fragment>
      <TableRow key={request.id} className={classes.root}  >

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
          <strong className="model">
            {equipment[0]?.model}
          </strong>
          <p>
            <small>
              {equipment.length > 1 ? `and ${equipment.length - 1} more` : ""}
            </small>
          </p>
        </TableCell>

        <TableCell component="th" scope="row" >
          <p>
            {request.salesman}
          </p>
          <small>
            {request.timestamp}
          </small>
        </TableCell>        
        
        <TableCell align="left">
          {isEditingWorkOrder 
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
          request.workOrder}
        </TableCell>
        
        <TableCell align="left">
          <Tooltip title="Update Status">
            <Button 
              color="success" 
              size="small" 
              variant={request.status === 'In Progress' ? "contained" : "outlined"} 
              onClick={updateStatus}
            >
              {request.status}
            </Button>
          </Tooltip>
          <p>
            <small>
              {request.statusTimestamp}
            </small>
          </p>
        </TableCell>
        
        <TableCell align="center">
          <IconButton 
            color="success" 
            className={classes.icon}
            onClick={editWorkOrder}>
               {isEditingWorkOrder 
                  ? 
                  <CheckIcon 
                    color="success" 
                    style={{ fontSize: 16 }}/> 
                  : 
                  <div className="edit-button-bg">  
                    <Tooltip title="Edit">
                      <EditRoundedIcon 
                        color="success" 
                        style={{ fontSize: 16 }}/>
                    </Tooltip>
                  </div>
                }
          </IconButton>
        </TableCell>

      </TableRow>

      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Table size="small" aria-label="equipment">
                <TableHead>
                  <TableRow key="subHeader">
                    <TableCell><strong>Model</strong></TableCell>
                    <TableCell>
                      <strong>ID #'s</strong>
                    </TableCell>
                    <TableCell><strong>Work Require</strong></TableCell>
                    <TableCell><strong>Notes</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {equipment.map((item) => (
                    <EquipmentRow key={item?.stock} item={item} />
                  ))}
                  { isShowingAddEquipment ?  
                    <TableRow key={request.id} style={{ fontSize: 18 }} className={classes.root} sx={{ '& > *': { borderBottom: 'unset' } }}>

                      <TableCell  component="th" scope="row">
                        <TextField variant="outlined" label="Model" inputProps={{style: {fontSize: 14}}} style={{ fontSize: 18 }} size="small" onChange={e=> setModel(e.target.value.toUpperCase())} value={model}> </TextField>
                      </TableCell>

                      <TableCell>
                        <TextField variant="outlined" label="Stock" inputProps={{style: {fontSize: 14}}} style={{ fontSize: 18 }} size="small" onChange={e=> setStock(e.target.value)} value={stock}> </TextField> 
                      </TableCell>

                      <TableCell>
                        <TextField variant="outlined" label="Serial" inputProps={{style: {fontSize: 14}}} style={{ fontSize: 18 }} size="small" onChange={e=> setSerial(e.target.value.toUpperCase())} value={serial}> </TextField> 
                      </TableCell>

                      <TableCell> 
                        <TextField variant="outlined" label="Work" inputProps={{style: {fontSize: 14}}} style={{ fontSize: 18 }} size="small" onChange={e=> setWork(e.target.value)} value={work}> </TextField> 
                      </TableCell>

                      <TableCell>
                        <TextField variant="outlined" label="notes" inputProps={{style: {fontSize: 14}}} style={{ fontSize: 18 }} size="small" onChange={e=> setNotes(e.target.value)} value={notes}> </TextField> 
                      </TableCell>

                      <TableCell align="center">
                        <IconButton 
                          color="success" 
                          style={{ fontSize: 20 }}
                          onClick={addEquipment}>
                            { model !== '' && stock !== '' && serial !== '' && work !== '' 
                              ?
                              <Tooltip title="Save">
                                <CheckIcon 
                                  color="success" 
                                  style={{ fontSize: 18 }}
                                  onClick={addEquipment}
                                />
                              </Tooltip>
                              :
                              <Tooltip title="Close">
                                <CloseIcon 
                                  color="success" 
                                  style={{ fontSize: 18 }}
                                  onClick={addEquipment}
                                />
                              </Tooltip>
                            }   
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    :
                    null
                  }
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
  const classes = useStyles();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(30);

  const filters = [
    30, 60, 90, '1 year'
  ]

  // Fetch requests from firestore:
  const fetch = useCallback( async ()=> {

    if(userProfile) {

      var dateRange

      filter === '1 year' ? dateRange = moment().subtract(1, 'years').format("yyyyMMDD") : dateRange = moment().subtract(filter, 'days').format("yyyyMMDD")
      
      var requestsQuery = query(

          collection(db, 'branches', userProfile?.branch, 'requests'),
          where('status', '==', 'Completed'),
          where('id','>', dateRange),
          orderBy("id", "desc"),
      );

      const docSnapshot = await getDocs(requestsQuery)      

      setRequests(docSnapshot.docs.map((doc) => ({
        id: doc.data().id,
        salesman: doc.data().salesman,
        timestamp: doc.data().timestamp,
        workOrder: doc.data().workOrder,
        status: doc.data().status,
        statusTimestamp: doc.data().statusTimestamp,
        changeLog: doc.data().changeLog
      })))
    }
  }, [userProfile, filter])

  useEffect(() => {
    fetch()
    setTimeout( function() { setLoading(false) }, 1000)
  }, [fetch])

  // Table UI:
  return (
    <React.Fragment>
      {loading 
        ? 
        <HomeSkeleton /> 
        : 
        <div className="tableHead">
          <Typography variant="h4" color='primary' style={{ marginLeft: 25, marginBottom: 10 }}>Completed Setup Requests</Typography>
          
          <TextField
            size="small"
            variant="outlined"
            labelId="demo-simple-select-label"
            id="filter"
            className={classes.select}
            value={filter}
            label="Previous Days"
            onChange={e=> setFilter(e.target.value)}
            select
          >
            {filters.map(filter => (
              <MenuItem value={filter}>
                {filter.toString()}
              </MenuItem>
            ))}
          </TextField>
        </div>
      }
      <TableContainer component={Paper} style={{ borderRadius: 10 }}>
        <Table  size="small"aria-label="collapsible table" style={{ margin: 15 }} sx={{ paddingTop: 2 }}>
          <TableHead>
            <TableRow key="header">
              <TableCell />
              <TableCell style={{ fontSize: 18 }} align="left"><strong>Model</strong></TableCell>
              <TableCell style={{ fontSize: 18 }} align="left"><strong>Submitted</strong></TableCell>
              <TableCell style={{ fontSize: 18 }} align="left"><strong>WO#</strong></TableCell>
              <TableCell style={{ fontSize: 18 }} align="left"><strong>Status</strong></TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map(request => (
              <Row request={request} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </React.Fragment>

  );
};