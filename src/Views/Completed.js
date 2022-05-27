import React from 'react';
import "../styles/Home.css";
import { Box } from '@mui/material';
import CompletedTable from './table-views/CompletedTable';

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