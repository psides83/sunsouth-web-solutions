import React from "react";
import { TableCell, TableHead, TableRow } from "@mui/material";

function HeaderRow({ headers }) {
  return (
    <TableHead>
      <TableRow>
        {headers.map((header) => (
          <TableCell key={header} align="left" sx={{ py: 1.25, fontSize: 14 }}>
            {header ? <strong>{header}</strong> : null}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

function RequestsTableHeaderView() {
  return <HeaderRow headers={["", "Model", "Submitted", "Work Order", "Status", ""]} />;
}

function TransportTableHeaderView() {
  return <HeaderRow headers={["", "Customer", "Status", ""]} />;
}

function EquipmentTableHeaderView() {
  return <HeaderRow headers={["Model", "ID #'s", "Work Order", "Work Required", "Part Numbers", "Notes"]} />;
}

function TransportEquipmentTableHeaderView() {
  return <HeaderRow headers={["Model", "ID #'s", "Notes"]} />;
}

function SalesmenTableHeaderView() {
  return <HeaderRow headers={["Name", "Email", "Branch"]} />;
}

export {
  RequestsTableHeaderView,
  EquipmentTableHeaderView,
  SalesmenTableHeaderView,
  TransportTableHeaderView,
  TransportEquipmentTableHeaderView,
};
