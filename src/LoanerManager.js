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
import { collection, query, where, orderBy, limit, onSnapshot, setDoc, doc } from 'firebase/firestore';
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
import CloseIcon from '@mui/icons-material/Close';
import emailjs from 'emailjs-com'

// Styles:
const useRowStyles = makeStyles({
    root: {
      '& > *': {
        borderBottom: 'unset',
      },
    },
  });

// Loaner row view:
function Row({loaner}) {
    const [{ userProfile }, dispatch] = useStateValue();
    const [open, setOpen] = useState(false);
    const [activeRequest, setActiveRequest] = useState({});
    const classes = useRowStyles();
    const history = useHistory();
    var [dateOut, setDateOut] = useState('');
    var [model, setModel] = useState('')
    var [stock, setStock] = useState('');
    var [serial, setSerial] = useState('');
    var [hours, setWork] = useState('');
    var [customer, setNotes] = useState('');
    // var [isEditingWorkOrder, setIsEditingWorkOrder] = useState(false);
    // var [isShowingAddEquipment, setIsShowingAddEquipment] = useState(false);
    const fullName = userProfile?.firstName + ' ' + userProfile?.lastName
  
    // Sends email when work order number is added or updated:
    // const sendWorkOrderEmail = (workOrder) => {
  
    //   // creates the paramaters for the email template:
    //   const timestamp = moment().format("MMM-DD-yyyy hh:mmA")
    //   const recipients = "mallen@sunsouth.com, svcwriter11@sunsouth.com, parts11@sunsouth.com"
    //   const subject = `UPDATED - request on model ${equipment[0]?.model}, ${equipment[0]?.stock}`
    //   const body = '<body>' + '<p>' + timestamp + '</p><br>' + '<p>Work order # ' + workOrder + " has been added or updated by " + fullName + " to the request on " + "model " + equipment[0]?.model + ', ' + "ST# " + equipment[0]?.stock + '.</p>' + '<body>';
  
    //   // Sets paramaters for the email template:
    //   const templateParams = {
    //     to: userProfile.email,
    //     replyTo: userProfile.email, 
    //     from: "PDI/Setup Requests", 
    //     copy: userProfile.email,
    //     subject: subject,
    //     message: body
    //   }
  
    //   // sends thw email:
    //   emailjs.send('service_5guvozs', 'template_5dg1ys6', templateParams, 'user_3ub5f4KJJHBND1Wzl1FQi')
    // }
  
    // Handles adding or editing the work order number for the request:
    // const editWorkOrder = async () => {
    //   if (isEditingWorkOrder) { 
  
    //     const workOrderStatus = request.workOrder == '' ? `Added work order ${workOrder}` : `Work order updated from ${request.workOrder} to ${workOrder}`
  
    //     const changeLogEntry = {
    //       user: fullName,
    //       change: workOrderStatus, 
    //       timestamp: moment().format("MMM-DD-yyyy hh:mmA")
    //     }
        
    //     if (request.workOrder != workOrder) {
    //     request.changeLog.push(changeLogEntry)
    //   }
  
    //     await setDoc(doc(db, 'branches', userProfile.branch, "requests", request.id), { workOrder: workOrder, changeLog: request.changeLog }, { merge: true })
    //     // sendWorkOrderEmail(workOrder)
    //     setIsEditingWorkOrder(false)
    //   } else { 
    //     setWorkOrder(request.workOrder)
    //     setIsEditingWorkOrder(true)
    //   }
    // }
  
    // Send email when request status is updated:
    // const sendStatusEmail = async (status) => {
  
    //   const timestamp = moment().format("MMM-DD-yyyy hh:mmA")
    //   const recipients = "mallen@sunsouth.com, svcwriter11@sunsouth.com, parts11@sunsouth.com"
    //   const subject = `UPDATED - Status updated to ${status} for model ${equipment[0]?.model}, ${equipment[0]?.stock}`
    //   const body = '<body>' + '<p>' + timestamp + '</p><br>' + '<p>Status of ' + equipment[0]?.model + " ST# " +equipment[0]?.stock +  " has been updated by " + fullName + " to " + status + '.</p>' + '<body>';
  
    //   const templateParams = {
    //     to: userProfile.email,
    //     replyTo: userProfile.email, 
    //     from: "PDI/Setup Requests", 
    //     copy: userProfile.email,
    //     subject: subject,
    //     message: body
    //   }
  
    //   await emailjs.send('service_5guvozs', 'template_5dg1ys6', templateParams, 'user_3ub5f4KJJHBND1Wzl1FQi')
    //     .then(() => {
    //       window.location.reload(false);
    //     })
    // }
  
    // Handles updating the request status:
    const updateStatus = async () => {
      var status = loaner.status
  
      switch (status) {
        case "Out":
          status = "Returned";
          break;
        default:
          status = "Complete";
      }
  
      const changeLogEntry = {
  
        user: fullName,
        change: `Status updated to ${status}`, 
        timestamp: moment().format("MMM-DD-yyyy hh:mmA")
      }
  
      loaner.changeLog.push(changeLogEntry)
  
      const loanerRef = doc(db, 'branches',  userProfile.branch, 'loaners', loaner.id);
  
      await setDoc(loanerRef, { 
  
        status: status, 
        statusTimestamp: moment().format("MMM-DD-yyyy"), 
        changeLog: loaner.changeLog 
      }, { 
        
        merge: true 
      });
  
    //   sendStatusEmail(status)
    }
  
    // Request row UI:
    return (
      <React.Fragment>
        <TableRow key={loaner.id} className={classes.root}  >

        <TableCell align="left">
            <strong className="model">
              {loaner?.dateOut}
            </strong>
          </TableCell>
  
          <TableCell component="th" scope="row" >
            <p>
              {loaner.employee}
            </p>
            <small>
              {loaner.timestamp}
            </small>
          </TableCell>  
          
          <TableCell align="left">
              {loaner?.model}
          </TableCell>

          <TableCell component="th" scope="row" >
            <p>
              {loaner.stock}
            </p>
            <small>
              {loaner.serial}
            </small>
          </TableCell>  
          
          <TableCell align="left">
            { loaner.hours }
          </TableCell>

          <TableCell align="left">
            { loaner.customer }
          </TableCell>
          
          <TableCell align="left">
            <Tooltip title="Update Status">
              <Button color="success" size="small" variant={loaner.status == 'In Progress' ? "contained" : "outlined"} onClick={updateStatus}>
                {loaner.status}
              </Button>
            </Tooltip>
            <p><small>
            {loaner.statusTimestamp}
            </small></p>
          </TableCell>
          
          {/* <TableCell align="center">
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
          </TableCell> */}
  
        </TableRow>
      </React.Fragment>
    );
  }

function LoanerManager() {
    const [{ userProfile }] = useStateValue();
  const [loaners, setLoaners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch loanerss from firestore:
  const fetch = async ()=> {
    const loanersQuery = query(
        collection(db, 'branches', userProfile?.branch, 'loaners'),
        where('status', '!=', 'Returned')
    );
    
    onSnapshot(loanersQuery, (querySnapshot) => {
        setLoaners(querySnapshot.docs.map((doc) => ({
          id: doc.data().id,
          dateOut: doc.data().dateOut,
          employee: doc.data().employee,
          timestamp: doc.data().timestamp,
          model: doc.data().model,
          stock: doc.data().stock,
          serial: doc.data().serial,
          hours: doc.data().hours,
          customer: doc.data().customer,
          status: doc.data().status,
          statusTimestamp: doc.data().statusTimestamp,
        //   changeLog: doc.data().changeLog
        })))
    });
  }

  useEffect(() => {
    fetch()
      .then(setTimeout( function() { setLoading(false) }, 1000)) 
  }, [])

  // Table UI:
  return (
    <React.Fragment>
      {loading ? <HomeSkeleton /> : <Typography variant="h4" color='primary' style={{ marginLeft: 25, marginBottom: 10 }}>{"Loaned Equipment"}</Typography>}
      <TableContainer component={Paper} style={{ borderRadius: 20 }}>
        <Table  size="small"aria-label="collapsible table" style={{ margin: 15 }} sx={{ paddingTop: 2 }}>
          <TableHead>
            <TableRow key="header">
                <TableCell style={{ fontSize: 18 }} align="left"><strong>Date Out</strong></TableCell>                
                <TableCell style={{ fontSize: 18 }} align="left"><strong>Employee</strong></TableCell>
                <TableCell style={{ fontSize: 18 }} align="left"><strong>Model</strong></TableCell>
                <TableCell style={{ fontSize: 18 }} align="left"><strong>ID's</strong></TableCell>
                <TableCell style={{ fontSize: 18 }} align="left"><strong>Hours</strong></TableCell>
                <TableCell style={{ fontSize: 18 }} align="left"><strong>Customer</strong></TableCell>
                <TableCell style={{ fontSize: 18 }} align="left"><strong>Status</strong></TableCell>
                <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {loaners.map(loaner => (
              <Row loaner={loaner} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </React.Fragment>

  );
}

export default LoanerManager