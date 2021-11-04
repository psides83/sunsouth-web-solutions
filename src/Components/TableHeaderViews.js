import React from 'react'
import { TableHead, TableRow, TableCell } from '@material-ui/core';

// Header for the Requests Table
function RequestsTableHeaderView() {
    return (
        <React.Fragment>
            <TableHead>
                <TableRow key="header">
                    <TableCell />
                    <TableCell style={{ fontSize: 18 }} align="left"><strong>Model</strong></TableCell>
                    <TableCell style={{ fontSize: 18 }} align="left"><strong>Submitted</strong></TableCell>
                    <TableCell style={{ fontSize: 18 }} align="left"><strong>WO#</strong></TableCell>
                    <TableCell style={{ fontSize: 18 }} align="left"><strong>Status</strong></TableCell>
                    <TableCell style={{ fontSize: 18 }} align="left"><strong>History</strong></TableCell>
                    <TableCell />
                </TableRow>
            </TableHead>
        </React.Fragment>
    )
}

// Header for the sub-table of equipment
function EquipmentTableHeaderView() {
    return (
        <React.Fragment>
            <TableHead>
                <TableRow key="subHeader">
                    <TableCell><strong>Model</strong></TableCell>
                    <TableCell><strong>ID #'s</strong></TableCell>
                    <TableCell><strong>Work Require</strong></TableCell>
                    <TableCell><strong>Notes</strong></TableCell>
                </TableRow>
            </TableHead>
        </React.Fragment>
    )
}



export { RequestsTableHeaderView, EquipmentTableHeaderView }
