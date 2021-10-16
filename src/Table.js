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
import { collection, query, where, limit, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
// import moment from 'moment';

const useRowStyles = makeStyles({
  root: {
    '& > *': {
      borderBottom: 'unset',
    },
  },
});

function Row({request}) {
  const [open, setOpen] = useState(false);
  const classes = useRowStyles();

  return (
    <React.Fragment>
      <TableRow className={classes.root}>
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
        <TableCell align="left">{request.data.status}</TableCell>
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
                  <TableRow>
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

  // const [{ user }, dispatch] = useStateValue();
  const [requests, setRequests] = useState([]);

    


    useEffect(() => {
        const requestsQuery = query(
            collection(db, 'requests'),
            where('status', '==', status)
        );
        
        onSnapshot(requestsQuery, (querySnapshot) => {
            setRequests(querySnapshot.docs.map((doc) => ({data: doc.data()})))
        });
    }, [])

  return (
    <TableContainer component={Paper}>
      <Table aria-label="collapsible table">
        <TableHead>
          <TableRow>
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
  );
};