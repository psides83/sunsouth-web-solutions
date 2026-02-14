import React, { useMemo, useState } from "react";
import HomeSkeleton from "../../components/HomeSkeleton";
import { SalesmenTableHeaderView } from "../../components/TableHeaderViews";
import TransferRequestView from "../TransferRequest";
import { branches } from "../../models/branches";
import useSalesmen from "../../hooks/useSalesmen";
import {
  Box,
  Button,
  Card,
  Container,
  Divider,
  Dialog,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  CloseRounded,
  LocalShippingRounded,
  SearchRounded,
  ViewAgendaRounded,
  ViewListRounded,
} from "@mui/icons-material";

// Loaner row view:
function Row({ salesman }) {
  const fullName = `${salesman.firstName} ${salesman.lastName}`;

  // Request row UI:
  return (
    <React.Fragment>
      <TableRow key={salesman.id} sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell key="name" align="left">
          <Typography variant="body2">{fullName}</Typography>
        </TableCell>

        <TableCell key="email" component="th" scope="row">
          <Button
            component="a"
            href={`mailto:${salesman.email}`}
            variant="text"
            size="small"
            sx={{ px: 0.25, minWidth: 0 }}
          >
            {salesman.email}
          </Button>
        </TableCell>

        <TableCell key="branch" component="th" scope="row">
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {salesman.branch}
          </Typography>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

// Whole table view:
export default function SalesmenList() {
  // #region State Properties
  const { salesmen, loading, loadError } = useSalesmen();
  const [searchText, setSearchText] = useState("");
  const [filterParam, setFilterParam] = useState("All");
  const [viewMode, setViewMode] = useState("table");
  const [emails, setEmails] = useState("");
  const [isShowingTransferRequest, setisShowingTransferRequest] =
    useState(false);
  // #endregion

  const handleCloseTransferRequest = () => {
    setisShowingTransferRequest(false);
  };

  const handleOpenTransferRequest = (salesmenSubset) => {
    const branchEmails = salesmenSubset
      .map((salesman) => salesman.email)
      .filter(Boolean)
      .join("; ");
    setEmails(branchEmails);
    setisShowingTransferRequest(true);
  };

  const filteredSalesmen = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return salesmen.filter((item) => {
      const branchMatches = filterParam === "All" || item.branch === filterParam;
      if (!branchMatches) return false;

      const searchable = `${item.branch} ${item.firstName} ${item.lastName}`.toLowerCase();
      return query === "" || searchable.includes(query);
    });
  }, [salesmen, filterParam, searchText]);

  const groupedByBranch = useMemo(() => {
    return filteredSalesmen.reduce((groups, salesman) => {
      const branchName = salesman.branch || "Unassigned";
      if (!groups[branchName]) {
        groups[branchName] = [];
      }
      groups[branchName].push(salesman);
      return groups;
    }, {});
  }, [filteredSalesmen]);

  const orderedBranches = useMemo(
    () => Object.keys(groupedByBranch).sort((a, b) => a.localeCompare(b)),
    [groupedByBranch]
  );

  // Table UI:
  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ flexGrow: 1 }}>
        {loading ? (
          <HomeSkeleton />
        ) : (
          <Card
            sx={{
              p: { xs: 1.5, md: 2.25 },
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", md: "flex-start" }}
              spacing={1.25}
              sx={{ mb: 1.5 }}
            >
              <Box>
                <Typography
                  variant="h5"
                  color="primary"
                  sx={{ fontSize: { xs: 22, sm: 26 } }}
                >
                  Active Salesmen
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Directory and transfer contacts by branch
                </Typography>
              </Box>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                flexWrap="wrap"
                useFlexGap
                spacing={1}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent={{ xs: "stretch", sm: "flex-end" }}
                sx={{ width: { xs: "100%", md: "auto" } }}
              >
                {filterParam !== "All" ? (
                  <Button
                    color="primary"
                    variant="outlined"
                    startIcon={<LocalShippingRounded />}
                    onClick={() => handleOpenTransferRequest(filteredSalesmen)}
                    disabled={filteredSalesmen.length === 0}
                    sx={{ alignSelf: { xs: "stretch", sm: "center" }, minHeight: 40 }}
                  >
                    Request Transfer
                  </Button>
                ) : null}

                <TextField
                  size="small"
                  variant="outlined"
                  id="filter"
                  value={filterParam}
                  label="Filter"
                  onChange={(e) => setFilterParam(e.target.value)}
                  select
                  sx={{ width: { xs: "100%", sm: 180 } }}
                >
                  <MenuItem value="All">All</MenuItem>
                  {branches.map((branch) => (
                    <MenuItem key={branch} value={branch}>
                      {branch}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  size="small"
                  variant="outlined"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search by name or branch"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRounded sx={{ color: "text.secondary", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: { xs: "100%", sm: 240 } }}
                />

                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={viewMode}
                  onChange={(_, next) => next && setViewMode(next)}
                  sx={{ alignSelf: { xs: "stretch", sm: "center" }, minHeight: 40 }}
                >
                  <ToggleButton value="table" aria-label="Table view">
                    <ViewListRounded sx={{ mr: 0.75, fontSize: 18 }} />
                    Table
                  </ToggleButton>
                  <ToggleButton value="cards" aria-label="Branch card view">
                    <ViewAgendaRounded sx={{ mr: 0.75, fontSize: 18 }} />
                    Cards
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Stack>
            {loadError ? (
              <Box
                sx={{
                  mb: 1.25,
                  p: 1.25,
                  border: "1px solid",
                  borderColor: "error.light",
                  bgcolor: "rgba(198, 40, 40, 0.08)",
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2" color="error.main">
                  {loadError}
                </Typography>
              </Box>
            ) : null}
            {viewMode === "table" ? (
              <TableContainer
                component={Paper}
                sx={{
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  overflowX: "auto",
                }}
              >
                <Table size="small" aria-label="salesmen table" sx={{ minWidth: 640 }}>
                  <SalesmenTableHeaderView />
                  <TableBody>
                    {filteredSalesmen.map((salesman) => (
                      <Row key={salesman.id} salesman={salesman} />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    lg: "repeat(3, minmax(0, 1fr))",
                  },
                  gap: 1.25,
                }}
              >
                {orderedBranches.map((branchName) => {
                  const branchSalesmen = groupedByBranch[branchName];
                  return (
                    <Card
                      key={branchName}
                      variant="outlined"
                      sx={{ p: 1.5, borderColor: "divider", borderRadius: 2.5 }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={1}
                        sx={{ mb: 1 }}
                      >
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {branchName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {`${branchSalesmen.length} salesman${branchSalesmen.length === 1 ? "" : "s"}`}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<LocalShippingRounded />}
                          onClick={() => handleOpenTransferRequest(branchSalesmen)}
                        >
                          Request Transfer
                        </Button>
                      </Stack>

                      <Divider sx={{ mb: 1 }} />

                      <Stack spacing={0.75}>
                        {branchSalesmen.map((salesman) => (
                          <Box
                            key={salesman.id}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 1,
                              py: 0.25,
                            }}
                          >
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                              <Typography variant="body2" noWrap>
                                {`${salesman.firstName} ${salesman.lastName}`}
                              </Typography>
                            </Stack>
                            <Button
                              component="a"
                              href={`mailto:${salesman.email}`}
                              size="small"
                              variant="text"
                              sx={{ px: 0.25, minWidth: 0, whiteSpace: "nowrap" }}
                            >
                              {salesman.email}
                            </Button>
                          </Box>
                        ))}
                      </Stack>
                    </Card>
                  );
                })}
              </Box>
            )}
            {filteredSalesmen.length === 0 && !loadError ? (
              <Box sx={{ py: 2, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  No salesmen match the current filter/search.
                </Typography>
              </Box>
            ) : null}
            <Dialog
              key="transferDialog"
              onClose={handleCloseTransferRequest}
              open={isShowingTransferRequest}
              fullWidth
              maxWidth="sm"
            >
              <Box sx={{ display: "flex", justifyContent: "flex-end", p: 0.5 }}>
                <Tooltip title="Close">
                  <IconButton aria-label="Close transfer request" onClick={handleCloseTransferRequest}>
                    <CloseRounded />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box sx={{ px: 1, pb: 1 }}>
                <TransferRequestView emails={emails} />
              </Box>
            </Dialog>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: { xs: "block", sm: "none" }, mt: 0.75 }}
            >
              Swipe horizontally to see all table columns.
            </Typography>
          </Card>
        )}
      </Box>
    </Container>
  );
}
