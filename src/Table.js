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
import { Avatar, Typography } from '@material-ui/core';
// import moment from 'moment';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import HomeSkeleton from './HomeSkeleton'
import './Table.css'


const useRowStyles = makeStyles({
  root: {
    '& > *': {
      borderBottom: 'unset',
    },
  },
});

function Row({request}) {
  const [{ userProfile }] = useStateValue();
  const [open, setOpen] = useState(false);
  const classes = useRowStyles();

  const updateStatus = () => {
    var status = request.data.status

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

    const requestRef = doc(db, 'branches',  userProfile.branch, 'requests', request.data.id);
    setDoc(requestRef, { status: status }, { merge: true });
  }

  return (
    <React.Fragment>
      <TableRow key={request.data.id} className={classes.root} sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton 
          aria-label="expand row" 
          size="small" 
          onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {request.data.timestamp}
        </TableCell>
        <TableCell align="left">{request.data.salesman}</TableCell>
        <TableCell align="left">{request.data.equipment[0].model}</TableCell>
        <TableCell align="left">{request.data.workOrder}</TableCell>
        <TableCell align="left"><Button color="success" size="small" variant="outlined" onClick={updateStatus}>{request.data.status}</Button></TableCell>
        <TableCell align="left">{request.data.statusTimestamp}</TableCell>
        <TableCell align="center">
          <IconButton 
            color="success" 
            size="small" 
            onClick="">
              <div className="edit-button-bg">  
                <EditRoundedIcon 
                color="success" 
                fontSizes="small"
                />
              </div>
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
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow key="subHeader">
                    <TableCell><strong>Model</strong></TableCell>
                    <TableCell><strong>Stock #</strong></TableCell>
                    <TableCell><strong>Serial #</strong></TableCell>
                    <TableCell><strong>Work Require</strong></TableCell>
                    <TableCell><strong>Notes</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {request.data.equipment?.map((item) => (
                    <TableRow key={item?.model}>
                      <TableCell  component="th" scope="row">{item?.model} </TableCell>
                      <TableCell>{item?.stock}</TableCell>
                      <TableCell>{item?.serial}</TableCell>
                      <TableCell>{item?.work}</TableCell>
                      <TableCell>{item?.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

export default function CollapsibleTable({status}) {
  const [{ userProfile }] = useStateValue();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async ()=> {
    console.log(userProfile)
    const requestsQuery = query(
        collection(db, 'branches', userProfile.branch, 'requests'),
        where('status', '==', status)
    );
    
    onSnapshot(requestsQuery, (querySnapshot) => {
        setRequests(querySnapshot.docs.map((doc) => ({data: doc.data()})))
    });
  }

  useEffect(() => {
    fetch()
      .then(setTimeout( function() { setLoading(false) }, 1000)) 
  }, [])

  return (
    <React.Fragment>
    {loading ? <HomeSkeleton /> : <Typography variant="h5" color='primary'>{status}</Typography>}
    <TableContainer component={Paper}>
      <Table aria-label="collapsible table">
        <TableHead>
          <TableRow key="header">
            <TableCell />
            <TableCell><strong>Submitted</strong></TableCell>
            <TableCell><strong>Salesman</strong></TableCell>
            <TableCell><strong>Model</strong></TableCell>
            <TableCell><strong>WO#</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell><strong>Updated</strong></TableCell>
            <TableCell></TableCell>
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