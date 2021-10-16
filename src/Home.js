import React, { useEffect, useState } from 'react';
import "./Home.css";
// import { db } from './firebase';
// import { useStateValue } from './StateProvider';
// import { collection, getDocs, query, orderBy, where, limit, onSnapshot } from 'firebase/firestore';
import CollapsibleTable from './Table';
// import { Paper } from '@mui/material';
import { Typography } from '@material-ui/core';

function Home() {
    


    return (
        <div className="home">
            <div className="table">
                <Typography variant="h5" color='primary'>In Progress</Typography>
                <div className="inProgress">
                    <CollapsibleTable status="In Progress"/>
                </div>
                <Typography variant="h5" color='primary'>Requested</Typography>
                <div className="requested">
                <CollapsibleTable status="Requested"/>
                </div>
            </div>
        </div>
    )
}

export default Home
