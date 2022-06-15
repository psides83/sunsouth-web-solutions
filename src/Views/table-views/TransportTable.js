import React from "react";
import { TableContainer, Table, TableBody, Paper } from "@mui/material";
import TransportRow from "./TransportManagerRow";

function TransportTable(props) {
  const { requests } = props;
  return (
    <TableContainer component={Paper} style={{ borderRadius: 10 }}>
      <Table
        size="small"
        aria-label="collapsible table"
        // style={{ margin: 15 }}
        sx={{ paddingTop: 2 }}
      >
        {/* <TransportTableHeaderView /> */}
        <TableBody>
          {requests.map((request) => (
            <TransportRow key={request.id} request={request} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default TransportTable;
