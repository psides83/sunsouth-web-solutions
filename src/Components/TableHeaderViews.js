import React from 'react'
import { TableHead, TableRow, TableCell } from '@material-ui/core';

// Header for the Requests Table
function RequestsTableHeaderView() {
    const headers = ['', 'Model', 'Submitted', 'Work Order', 'Status', '']

    return (
        <React.Fragment>
            <TableHead>
                <TableRow key="header">
                    {headers.map((header) => (
                        <TableCell style={{ fontSize: 18 }} align="left"><strong>{header}</strong></TableCell>
                    ))}
                </TableRow>
            </TableHead>
        </React.Fragment>
    )
}

// Header for the Requests Table
function TransportTableHeaderView() {
    const headers = ['', 'Customer', 'Status', '']

    return (
        <React.Fragment>
            <TableHead>
                <TableRow key="header">
                    {headers.map((header) => (
                        <TableCell style={{ fontSize: 18 }} align="left"><strong>{header}</strong></TableCell>
                    ))}
                </TableRow>
            </TableHead>
        </React.Fragment>
    )
}

// Header for the sub-table of equipment
function EquipmentTableHeaderView() {
    const headers = ['Model', 'ID #\'s', 'Work Require', 'Notes']

    return (
        <React.Fragment>
            <TableHead>
                <TableRow key="subHeader">
                    {headers.map((header) => (
                        <TableCell><strong>{header}</strong></TableCell>
                    ))}
                </TableRow>
            </TableHead>
        </React.Fragment>
    )
}

// Header for the sub-table of equipment
function TransportEquipmentTableHeaderView() {
    const headers = ['Model', 'ID #\'s', 'Notes']

    return (
        <React.Fragment>
            <TableHead>
                <TableRow key="subHeader">
                    {headers.map((header) => (
                        <TableCell><strong>{header}</strong></TableCell>
                    ))}
                </TableRow>
            </TableHead>
        </React.Fragment>
    )
}

// Header for the sub-table of equipment
function SalesmenTableHeaderView() {
    const headers = ['Branch', 'Name', 'Email' ]

    return (
        <React.Fragment>
            <TableHead>
                <TableRow key="subHeader">
                    {headers.map((header) => (
                        <TableCell key={header}><strong>{header}</strong></TableCell>
                    ))}
                </TableRow>
            </TableHead>
        </React.Fragment>
    )
}

export { RequestsTableHeaderView, EquipmentTableHeaderView, SalesmenTableHeaderView, TransportTableHeaderView, TransportEquipmentTableHeaderView }
