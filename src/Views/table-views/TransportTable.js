import React from "react";
import { TableContainer, Table, TableBody, Paper } from "@mui/material";
import TransportRow from "./TransportManagerRow";

function TransportTable(props) {
  const { requests } = props;
  return (
    <TableContainer
      component={Paper}
      sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflowX: "auto" }}
    >
      <Table
        size="small"
        aria-label="collapsible table"
        sx={{ minWidth: 620, paddingTop: 2 }}
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
