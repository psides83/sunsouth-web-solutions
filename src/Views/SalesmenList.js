import React, { useCallback, useEffect, useState } from 'react';
import { useStateValue } from './StateProvider';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { collection, query, where, getDocs, orderBy, setDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import Button from '@mui/material/Button';
import { Input, TableFooter, TextField, Tooltip, Typography } from '@material-ui/core';
import moment from 'moment';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import HomeSkeleton from './HomeSkeleton'
import './SalesmenList.css'
import { Link, useHistory } from 'react-router-dom';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import emailjs from 'emailjs-com'

// Styles:
const useRowStyles = makeStyles({
    root: {
      '& > *': {
        // borderBottom: 'unset',
      },
    },
  });

// Loaner row view:
function Row({salesman}) {
    const [{ userProfile }] = useStateValue();
    const classes = useRowStyles();
    const fullName = `${salesman.firstName} ${salesman.lastName}`
  
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
  
    //   // sends the email:
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
    // const sendStatusEmail = async () => {
  
    //   const timestamp = moment().format("MMM-DD-yyyy hh:mmA")
    //   const recipients = "mallen@sunsouth.com, svcwriter11@sunsouth.com, parts11@sunsouth.com"
    //   const subject = `${loaner?.model}, ${loaner?.stock} has been returned`
    //   const body = `<body>
    //                   <h2>Loaned Equipment Returned</h2>
    //                   <dl>
    //                     <dt>Date Returned: ${timestamp}</dt>
    //                     <dt>Model: ${loaner.model}</dt>
    //                     <dt>Stock Number: ${loaner?.stock}</dt>
    //                     <dt>Customer: ${loaner.customer}</dt>
    //                     <dt>Loaning Employee: ${fullName}</dt>
    //                   </dl>
    //                 </body>`;
  
    //   const templateParams = {
    //     to: userProfile.email,
    //     replyTo: userProfile.email, 
    //     from: "Loaned Equipment Manager", 
    //     copy: userProfile.email,
    //     subject: subject,
    //     message: body
    //   }
  
    //   await emailjs.send('service_5guvozs', 'template_5dg1ys6', templateParams, 'user_3ub5f4KJJHBND1Wzl1FQi')
    // }
  
    // Handles updating the request status:
    // const updateStatus = async () => {
    //   var status = loaner.status
  
    //   switch (status) {
    //     case "Out":
    //       status = "Returned";
    //       break;
    //     default:
    //       status = "Returned";
    //   }
  
    //   const changeLogEntry = {
  
    //     user: fullName,
    //     change: `Status updated to ${status}`, 
    //     timestamp: moment().format("MMM-DD-yyyy hh:mmA")
    //   }
  
    //   loaner.changeLog.push(changeLogEntry)
  
    //   const loanerRef = doc(db, 'branches',  userProfile.branch, 'loaners', loaner.id);
  
    //   await setDoc(loanerRef, { 
  
    //     status: status, 
    //     statusTimestamp: moment().format("MMM-DD-yyyy"), 
    //     changeLog: loaner.changeLog 
    //   }, { 
        
    //     merge: true 
    //   });
  
    //   sendStatusEmail(status)
    // }
  
    // Request row UI:
    return (
      <React.Fragment>
        <TableRow key={salesman.id} className={classes.root}  >
  
            <TableCell component="th" scope="row" >
                {salesman.branch}
            </TableCell>  
          
            <TableCell align="left">
              {fullName}
            </TableCell>

            <TableCell component="th" scope="row" >
                {salesman.email}
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

  // Whole table view:
  export default function SalesmenList() {
  const [{ userProfile }] = useStateValue();
  const [salesmen, setSalesmen] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch loanerss from firestore:
  const fetch = useCallback( async ()=> {
    if(userProfile) {
      const salesmenQuery = query(
        collection(db, 'salesmen'),
        //   where('status', '!=', 'Returned')
        orderBy("branch", "asc")
      );
      
      const docSnapshot = await getDocs(salesmenQuery)

        setSalesmen(docSnapshot.docs.map((doc) => ({
            id: doc.data().id,
            branch: doc.data().branch,
            email: doc.data().email,
            firstName: doc.data().firstName,
            lastName: doc.data().lastName,
            position: doc.data().position,
          })))
    }
  }, [userProfile])

  useEffect(() => {
    fetch()
    setTimeout( function() { setLoading(false) }, 1000)
  }, [fetch])

  // Table UI:
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: "5"}}>
        <Box sx={{ width: '95%', mt: 5, mx:5 }}>
          <Box sx={{ flexGrow: 1, my: 5 }}>
          {loading 
            ? 
            <HomeSkeleton /> 
            : 
            <div className="tableHead">
              <Typography variant="h4" color='primary' style={{ marginLeft: 25, marginBottom: 10 }}>{"Active Salesmen"}</Typography>
              {/* <Link className="link" to={"/add-loaner"}>
              <Button color="success" size="small" variant="outlined" startIcon={<AddIcon />} sx={{ mx: 4, mb: 1, mt: 1 }}>
                Add Loaner
              </Button>
              </Link> */}
            </div>
          }
            <TableContainer component={Paper} style={{ borderRadius: 10 }}>
              <Table  size="small" aria-label="collapsible table" style={{ margin: 15 }} sx={{ paddingTop: 2 }}>
                <TableHead>
                  <TableRow key="header">
                      {/* <TableCell style={{ fontSize: 18 }} align="left"><strong>Date Out</strong></TableCell>                 */}
                      <TableCell style={{ fontSize: 18 }} align="left"><strong>Branch</strong></TableCell>
                      <TableCell style={{ fontSize: 18 }} align="left"><strong>Name</strong></TableCell>
                      <TableCell style={{ fontSize: 18 }} align="left"><strong>Email</strong></TableCell>
                      {/* <TableCell style={{ fontSize: 18 }} align="left"><strong>Hours</strong></TableCell> */}
                      {/* <TableCell style={{ fontSize: 18 }} align="left"><strong>Customer</strong></TableCell> */}
                      {/* <TableCell style={{ fontSize: 18 }} align="left"><strong>Status</strong></TableCell> */}
                      {/* <TableCell /> */}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {salesmen.map(salesman => (
                    <Row salesman={salesman} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </Box> 
  );
}