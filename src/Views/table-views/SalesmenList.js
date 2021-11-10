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
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { MenuItem, TextField, Typography } from '@material-ui/core';
import Button from '@mui/material/Button';
import HomeSkeleton from '../../components/HomeSkeleton'
import '../../styles/SalesmenList.css'
import { SalesmenTableHeaderView } from '../../components/TableHeaderViews'
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import TransferRequestView from '../TransferRequest';
import Dialog from '@mui/material/Dialog';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { branches } from '../../components/branches';

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
        </TableRow>
      </React.Fragment>
    );
  }

  // Whole table view:
  export default function SalesmenList() {
    const [{ userProfile }] = useStateValue();
    const [salesmen, setSalesmen] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [searchParam] = useState(["branch", "firstName", "lastName"]);
    const [filterParam, setFilterParam] = useState("All");
    const [emails, setEmails] = useState('')
    const [isShowingTransferRequest, setisShowingTransferRequest] = useState(false)
    
    const handleCloseTransferRequest = () => {
      setisShowingTransferRequest(false);
    };
    
    const handleToggleTransferRequest = () => {
      setEmails(() => {
        var branchEmails = []
        search(salesmen).map((salesman) => (
            branchEmails.push(salesman.email)
        )) 
        return branchEmails.toString().replace(/,[s]*/g, ", ")
      })
      setisShowingTransferRequest(!isShowingTransferRequest);
    };

    


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

  const search = (salesmen) => {
    return salesmen.filter((item) => {
      /*
      // in here we check if our region is equal to our c state
      // if it's equal to then only return the items that match
      // if not return All the countries
      */
      if (item.branch == filterParam) {
        return searchParam.some((newItem) => {
          return (
            item[newItem]
                .toString()
                .toLowerCase()
                .indexOf(searchText.toLowerCase()) > -1
          );
        });
      } else if (filterParam == "All") {
        return searchParam.some((newItem) => {
          return (
              item[newItem]
                  .toString()
                  .toLowerCase()
                  .indexOf(searchText.toLowerCase()) > -1
          );
        });
      }
    });
  };

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
              <div className="searchAndFilter"> 

                { filterParam !== 'All'
                ?
                <div className="transferButton">
                  <Button
                    color="success" 
                    variant="outlined" 
                    endIcon={<LocalShippingIcon />} 
                    onClick={handleToggleTransferRequest}
                  >
                    Requst Transfer
                  </Button>
                  <Dialog onClose={handleCloseTransferRequest} open={isShowingTransferRequest}>
                    <div className="closeButtonContainer">
                      <Button onClick={handleCloseTransferRequest} color="success">
                        <CancelOutlinedIcon/>
                      </Button>
                    </div>
                    <div className="transferRequestView">
                      <TransferRequestView emails={emails}/>
                    </div>
                  </Dialog>
                </div>
                :
                null
                }

                <div className="filter">
                  <TextField
                    size="small"
                    fullWidth
                    variant="outlined"
                    labelId="demo-simple-select-label"
                    id="filter"
                    // className={classes.select}
                    value={filterParam}
                    label="Filter"
                    onChange={e=> setFilterParam(e.target.value)}
                    select
                  >
                    <MenuItem value="All">All</MenuItem>
                      {branches.map(branch => (
                        <MenuItem value={branch}>{branch}</MenuItem>
                      ))}
                  </TextField>
                </div>

                <div className="search">
                  <input type="text" id="search" onChange={e=> setSearchText(e.target.value)}placeholder="Search"></input>
                </div>

              </div>
            </div>
          }
            <TableContainer component={Paper} style={{ borderRadius: 10 }}>
              <Table  size="small" aria-label="collapsible table" style={{ margin: 15 }} sx={{ paddingTop: 2 }}>
                <SalesmenTableHeaderView/>
                <TableBody>
                  {search(salesmen).map(salesman => (
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