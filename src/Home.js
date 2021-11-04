import React from 'react';
import "./Home.css";
import ActiveRequestsTable from './ActiveRequestsTable';
import { Box } from '@mui/system';

function Home() {
    
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: "5"}}>
            <Box sx={{ width: '100%', mt: 5, mx:5 }}>
                <Box sx={{ flexGrow: 1, my: 5 }}>
                    <ActiveRequestsTable/>
                </Box>
                {/* <Box sx={{ flexGrow: 1 }}>
                    <ActiveRequestsTable status="Requested"/>
                </Box> */}
            </Box>
        </Box>
    )
}

export default Home
