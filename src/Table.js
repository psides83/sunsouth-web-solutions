import React, { useEffect, useState } from 'react';
import { useStateValue } from './StateProvider';
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
// import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import { collection, query, where, limit, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import transitions from '@material-ui/core/styles/transitions';
import { Avatar, Input, TableFooter, TextField, Tooltip, Typography } from '@material-ui/core';
import moment from 'moment';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import HomeSkeleton from './HomeSkeleton'
import './Table.css'
import { useHistory } from 'react-router';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';

const useRowStyles = makeStyles({
  root: {
    '& > *': {
      borderBottom: 'unset',
    },
  },
});

function EquipmentRow({item}) {
  const [{ userProfile }, dispatch] = useStateValue();
  const classes = useRowStyles();
  var [model, setModel] = useState('')
  var [stock, setStock] = useState('');
  var [serial, setSerial] = useState('');
  var [work, setWork] = useState('');
  var [notes, setNotes] = useState('');
  var [isEditingEquipment, setIsEditingEquipment] = useState(false);
  
  console.log(isEditingEquipment)

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

  return (
    <React.Fragment>
      <TableRow key={item.requestID} style={{ fontSize: 18 }} className={classes.root} sx={{ '& > *': { borderBottom: 'unset' } }}>

        <TableCell  component="th" scope="row">
          {isEditingEquipment ? <TextField variant="outlined" inputProps={{style: {fontSize: 14}}} style={{ fontSize: 18 }} size="small" onChange={e=> setModel(e.target.value.toUpperCase())} value={model}> </TextField> : item.model}
        </TableCell>

        <TableCell>
          {isEditingEquipment ? <TextField variant="outlined" inputProps={{style: {fontSize: 14}}} style={{ fontSize: 18 }} size="small" onChange={e=> setStock(e.target.value)} value={stock}> </TextField> : item.stock}
        </TableCell>

        <TableCell>
          {isEditingEquipment ? <TextField variant="outlined" inputProps={{style: {fontSize: 14}}} style={{ fontSize: 18 }} size="small" onChange={e=> setSerial(e.target.value.toUpperCase())} value={serial}> </TextField> : item.serial }
        </TableCell>

        <TableCell> 
          {isEditingEquipment ? <TextField variant="outlined" inputProps={{style: {fontSize: 14}}} style={{ fontSize: 18 }} size="small" onChange={e=> setWork(e.target.value)} value={work}> </TextField> : item.work}
        </TableCell>

        <TableCell>
          {isEditingEquipment ? <TextField variant="outlined" inputProps={{style: {fontSize: 14}}} style={{ fontSize: 18 }} size="small" onChange={e=> setNotes(e.target.value)} value={notes}> </TextField> : item.notes}
        </TableCell>
        
        <TableCell align="center">
          <IconButton 
            color="success" 
            style={{ fontSize: 20 }}
            onClick={editEquipment}>
              { 
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

function Row({request}) {
  const [{ userProfile }, dispatch] = useStateValue();
  const [open, setOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState({});
  const classes = useRowStyles();
  const history = useHistory();
  var [workOrder, setWorkOrder] = useState('');
  var [equipment, setEquipment] = useState([]);
  var [model, setModel] = useState('')
  var [stock, setStock] = useState('');
  var [serial, setSerial] = useState('');
  var [work, setWork] = useState('');
  var [notes, setNotes] = useState('');
  var [isEditingWorkOrder, setIsEditingWorkOrder] = useState(false);
  var [isShowingAddEquipment, setIsShowingAddEquipment] = useState(false);

  const fetchEquipment = async ()=> {
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
        })))
    });
  } 

  useEffect(() => {
    fetchEquipment()
  }, [])

  const editWorkOrder = async () => {
    if (isEditingWorkOrder) { 
      await setDoc(doc(db, 'branches', userProfile.branch, "requests", request.id), { workOrder: workOrder}, { merge: true })
      setIsEditingWorkOrder(false)
    } else { 
      setWorkOrder(request.workOrder)
      setIsEditingWorkOrder(true)
    }
  }

  const addEquipment = async () => {
    const equipment = {
      requestID: request.id,
      model: model,
      stock: stock,
      serial: serial,
      work: work,
      notes: notes
    }
    
    const equipmentRef = doc(db, 'branches',  userProfile.branch, 'requests', request.id, 'equipment', equipment.stock);
    await setDoc(equipmentRef, equipment, { merge: true });
    setIsShowingAddEquipment(false)
    setEquipment([])
    setModel('')
    setStock('')
    setSerial('')
    setWork('')
    setNotes('')
  }

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

    const timestamp = moment().format("MMM-DD-yyyy")


    const requestRef = doc(db, 'branches',  userProfile.branch, 'requests', request.id);
    await setDoc(requestRef, { status: status, statusTimestamp: timestamp }, { merge: true });
    window.location.reload(false);
  }

  return (
    <React.Fragment>
      <TableRow key={request.id} className={classes.root}  >

        <TableCell>
          <IconButton 
            aria-label="expand row" 
            size="small" 
            onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>

        <TableCell component="th" scope="row" >
          {request.timestamp}
        </TableCell>

        <TableCell align="left">
          {request.salesman}
        </TableCell>
        
        <TableCell align="left"><p className="model">{equipment[0]?.model}</p></TableCell>
        
        <TableCell align="left">
          {isEditingWorkOrder 
          ? 
          <TextField 
            variant="outlined" 
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
            <Button color="success" size="small" variant="outlined" onClick={updateStatus}>
              {request.status}
            </Button>
          </Tooltip>
        </TableCell>
        
        <TableCell align="left">
          {request.statusTimestamp}
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
              {/* <Typography variant="h6" gutterBottom component="div">
                Details
              </Typography> */}
              <Table size="small" aria-label="equipment">
                <TableHead>
                  <TableRow key="subHeader">
                    <TableCell><strong>Model</strong></TableCell>
                    <TableCell><strong>Stock #</strong></TableCell>
                    <TableCell><strong>Serial #</strong></TableCell>
                    <TableCell><strong>Work Require</strong></TableCell>
                    <TableCell><strong>Notes</strong></TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {equipment.map((item) => (
                    <EquipmentRow key={item?.stock} item={item} />
                  ))}
                  { isShowingAddEquipment ?  
                    <TableRow key={request.id} style={{ fontSize: 18 }} className={classes.root} sx={{ '& > *': { borderBottom: 'unset' } }}>

                      <TableCell  component="th" scope="row">
                        <TextField variant="outlined" inputProps={{style: {fontSize: 14}}} style={{ fontSize: 18 }} size="small" onChange={e=> setModel(e.target.value.toUpperCase())} value={model}> </TextField>
                      </TableCell>

                      <TableCell>
                        <TextField variant="outlined" inputProps={{style: {fontSize: 14}}} style={{ fontSize: 18 }} size="small" onChange={e=> setStock(e.target.value)} value={stock}> </TextField> 
                      </TableCell>

                      <TableCell>
                        <TextField variant="outlined" inputProps={{style: {fontSize: 14}}} style={{ fontSize: 18 }} size="small" onChange={e=> setSerial(e.target.value.toUpperCase())} value={serial}> </TextField> 
                      </TableCell>

                      <TableCell> 
                        <TextField variant="outlined" inputProps={{style: {fontSize: 14}}} style={{ fontSize: 18 }} size="small" onChange={e=> setWork(e.target.value)} value={work}> </TextField> 
                      </TableCell>

                      <TableCell>
                        <TextField variant="outlined" inputProps={{style: {fontSize: 14}}} style={{ fontSize: 18 }} size="small" onChange={e=> setNotes(e.target.value)} value={notes}> </TextField> 
                      </TableCell>

                      <TableCell align="center">
                        <IconButton 
                          color="success" 
                          style={{ fontSize: 20 }}
                          onClick={addEquipment}>
                          <Tooltip title="Save">
                            <CheckIcon 
                            color="success" 
                            style={{ fontSize: 18 }}
                            /> 
                          </Tooltip>
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    :
                    null
                  }
                </TableBody>
                <TableFooter>
                  <TableRow key="addButton" style={{ fontSize: 18 }} className={classes.root} sx={{ '& > *': { borderBottom: 'unset' } }}>
                    <TableCell>
                      <Button startIcon={<AddIcon />} color="success" >
                        Add Equipment
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

export default function CollapsibleTable() {
  const [{ userProfile }] = useStateValue();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async ()=> {
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
          statusTimestamp: doc.data().statusTimestamp
        })))
    });
  }

  useEffect(() => {
    fetch()
      .then(setTimeout( function() { setLoading(false) }, 1000)) 
  }, [])

  return (
    <React.Fragment>
      {loading ? <HomeSkeleton /> : <Typography variant="h4" color='primary' style={{ marginLeft: 25, marginBottom: 10 }}>{"Active Requests"}</Typography>}
      <TableContainer component={Paper}>
        <Table  size="small"aria-label="collapsible table" sx={{ paddingTop: 2 }}>
          <TableHead>
            <TableRow key="header">
              <TableCell />
              <TableCell style={{ fontSize: 18 }}><strong>Submitted</strong></TableCell>
              <TableCell style={{ fontSize: 18 }}><strong>Salesman</strong></TableCell>
              <TableCell style={{ fontSize: 18 }}><strong>Model</strong></TableCell>
              <TableCell style={{ fontSize: 18 }}><strong>WO#</strong></TableCell>
              <TableCell style={{ fontSize: 18 }}><strong>Status</strong></TableCell>
              <TableCell style={{ fontSize: 18 }}><strong>Updated</strong></TableCell>
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