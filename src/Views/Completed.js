import React from 'react';
import "./Home.css";
import { Box } from '@mui/system';
import CompletedTable from './CompletedTable';

function Completed() {
    
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: "5"}}>
            <Box sx={{ width: '100%', mt: 5, mx:5 }}>
                <Box sx={{ flexGrow: 1, my: 5 }}>
                    <CompletedTable />
                </Box>
            </Box>
        </Box>
    )
}

export default Completed