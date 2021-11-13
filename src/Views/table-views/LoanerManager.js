import React, { useCallback, useEffect, useState } from 'react';
import { useStateValue } from '../../state-management/StateProvider';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { collection, query, where, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import Button from '@mui/material/Button';
import { Dialog, Tooltip, Typography } from '@material-ui/core';
import moment from 'moment';
import HomeSkeleton from '../../components/HomeSkeleton'
import '../../styles/LoanerManager.css'
import AddIcon from '@mui/icons-material/Add';
import AddLoanerView from '../AddLoanerView'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { sendLoanerStatusEmail } from '../../services/email-service';
import Spinner from '../../components/Spinner';
import { DialogTitle } from '@mui/material';

// Styles:
const useRowStyles = makeStyles({
    root: {
      '& > *': {
        // borderBottom: 'unset',
      },
    },
  });

// Loaner row view:
function Row({loaner}) {
  // #region State Properties
    const [{ userProfile }] = useStateValue();
    const classes = useRowStyles();
    const [isShowingConfirmDialog, setIsShowingConfirmDialog] = useState(false)
    const [isShowingSpinner, setIsShowingSpinner] = useState(false)
    const fullName = `${userProfile?.firstName} ${userProfile?.lastName}`;
  // #endregion 

  const handleCloseConfirmDialog = () => {
    setIsShowingConfirmDialog(false);
  };

  const handleToggleConfirmDialog = () => {
    setIsShowingConfirmDialog(!isShowingConfirmDialog);
  };
  
  // Handles updating the request status:
  const updateStatus = async () => {

    setIsShowingSpinner(true)
    var status = loaner.status

    switch (status) {
      case "Out":
        status = "Returned";
        break;
      default:
        status = "Returned";
    }

    const changeLogEntry = {

      user: fullName,
      change: `Status updated to ${status}`, 
      timestamp: moment().format("DD-MMM-yyyy hh:mmA")
    }

    loaner.changeLog.push(changeLogEntry)

    const loanerRef = doc(db, 'branches',  userProfile.branch, 'loaners', loaner.id);

    await setDoc(loanerRef, { 

      status: status, 
      statusTimestamp: moment().format("DD-MMM-yyyy"), 
      changeLog: loaner.changeLog 
    }, { merge: true });

    sendLoanerStatusEmail(loaner, fullName, userProfile)
    handleCloseConfirmDialog()
    setTimeout( function() { setIsShowingSpinner(false) }, 1000)
  }

  const statusUpdateText = () => {
    if(loaner.status === 'Out') {
      return 'Returned'
    } else {
      return 'Out'
    }
  }

  // Request row UI:
  return (
    <React.Fragment>
      <TableRow key={loaner.id} className={classes.root}  >
        <TableCell key={loaner.employee} component="th" scope="row" >
          <p>
            {loaner.employee}
          </p>
          <small>
            {loaner.timestamp}
          </small>
        </TableCell>  
        
        <TableCell key={loaner.model} align="left">
            {loaner.model}
        </TableCell>

        <TableCell key={loaner.stock} component="th" scope="row" >
          <p>
            {`Stock: ${loaner.stock}`}
          </p>
          <small>
            {`Serial: ${loaner.serial}`}
          </small>
        </TableCell>  
        
        <TableCell key={loaner.hours} align="left">
          { loaner.hours }
        </TableCell>

        <TableCell key={loaner.customer} align="left">
          { loaner.customer }
        </TableCell>
        
        <TableCell  key={loaner.status} align="left">
          <Tooltip title="Update Status">
            <Button color="success" size="small" variant="outlined" onClick={handleToggleConfirmDialog}>
              {loaner.status}
            </Button>
          </Tooltip>
          <p><small>
          {loaner.statusTimestamp}
          </small></p>

          <Dialog onClose={handleCloseConfirmDialog} open={isShowingConfirmDialog}>
              <div style={{ display: 'flex', flexDirection: 'column', margin: '5px 25px 25px 25px' }}>
                <DialogTitle>Confirm Update</DialogTitle>
                {
                  isShowingSpinner
                  ?
                  <div style={{ justifyContent: 'center', alignContent: 'center', justifySelf: 'center', alignSelf: 'center' }}>
                    <Typography>Saving</Typography>
                    <Spinner frame={false}/>
                  </div>
                  :
                  <div>
                    <Typography>{`Update the loaner's status from`}</Typography>
                    <Typography>{`\"${loaner.status}" to "${statusUpdateText()}"?`}</Typography>
                    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: '25px' }}>
                      <Button variant="outlined" color="error" onClick={handleCloseConfirmDialog}>Cancel</Button>
                      <Button variant="contained" color="success" onClick={updateStatus}>Update</Button>
                    </div>
                  </div>
                }
                </div>
              </Dialog>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

  // Whole table view:
export default function LoanerManager() {
  // #region State Properties
  const [{ userProfile }] = useStateValue();
  const [loaners, setLoaners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddLoanerView, setOpenAddLoanerView] = useState(false);
  // #endregion

  const handleCloseAddLoanerView = () => {
    setOpenAddLoanerView(false);
  };
  const handleToggleAddLoanerView = () => {
    setOpenAddLoanerView(!openAddLoanerView);
  };

  // Fetch loanerss from firestore:
  const fetch = useCallback( async ()=> {
    console.log(userProfile?.branch)
    if(userProfile) {
      const loanersQuery = query(
          collection(db, 'branches', userProfile?.branch, 'loaners'),
          where('status', '!=', 'Returned')
      );
      
      await onSnapshot(loanersQuery, (querySnapshot) => {
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
            changeLog: doc.data().changeLog
          })))

          setTimeout( function() { setLoading(false) }, 1000)
      });
    }
  }, [userProfile])

  useEffect(() => {
    fetch()
  }, [fetch])

  // Table UI:
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: "5"}}>
        <Box sx={{ width: '100%', mt: 5, mx: 5 }}>
          <Box sx={{ flexGrow: 1, my: 4 }}>
            {loading 
              ? 
              <HomeSkeleton /> 
              : 
              <div className="tableHead">
                <Typography variant="h4" color='primary' style={{ marginLeft: 25, marginBottom: 10 }}>{"Loaned Equipment Manager"}</Typography>
                <Button onClick={handleToggleAddLoanerView} color="success" size="small" variant="outlined" startIcon={<AddIcon />} sx={{ mx: 4, mb: 1, mt: 1 }}>
                  Add Loaner
                </Button>
              </div>
            }

            <Dialog key="dialog" onClose={handleCloseAddLoanerView} open={openAddLoanerView}>
              <div className="closeButtonContainer">
                <Button onClick={handleCloseAddLoanerView} color="success">
                  <CancelOutlinedIcon/>
                </Button>
              </div>
              <div className="addLoaner" >
              <AddLoanerView/>
              </div>
            </Dialog>

            <TableContainer key="headerContainer" component={Paper} style={{ borderRadius: 10, paddingRight: 20 }}>
              <Table  size="small" aria-label="collapsible table" style={{ margin: 15, paddingTop: 2 }}>
                <TableHead>
                  <TableRow key="header">
                      <TableCell key="employee" style={{ fontSize: 18 }} align="left"><strong>Employee</strong></TableCell>
                      <TableCell key="model" tyle={{ fontSize: 18 }} align="left"><strong>Model</strong></TableCell>
                      <TableCell key="ids" style={{ fontSize: 18 }} align="left"><strong>ID's</strong></TableCell>
                      <TableCell key="hours" style={{ fontSize: 18 }} align="left"><strong>Hours</strong></TableCell>
                      <TableCell key="customer" style={{ fontSize: 18 }} align="left"><strong>Customer</strong></TableCell>
                      <TableCell key="status" style={{ fontSize: 18 }} align="left"><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loaners.map(loaner => (
                    <Row loaner={loaner} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </Box> 
  );
}