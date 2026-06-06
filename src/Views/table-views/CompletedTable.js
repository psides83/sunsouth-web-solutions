import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useStateValue } from "../../state-management/StateProvider";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  setDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import moment from "moment";
import HomeSkeleton from "../../components/HomeSkeleton";
import "../../styles/Table.css";
import { RequestsTableHeaderView } from "../../components/TableHeaderViews";
import TableToolbar from "../../components/TableToolbar";
import RequestRow from "./ActiveRequestRow";
import {
  Box,
  Card,
  Chip,
  Divider,
  Drawer,
  Dialog,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableContainer,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  CloseRounded,
  HistoryOutlined,
  PrintOutlined,
  ViewAgendaRounded,
  ViewListRounded,
} from "@mui/icons-material";
import {
  formatRelativeTimestamp,
  formatTimestampWithRelative,
} from "../../utils/dateTime";
import {
  CHANGE_ACTION_FILTER_ALL,
  getChangeLogActionOptions,
  normalizeChangeLogEntry,
} from "../../utils/changeLog";
import useAlgoliaRequestSearch from "../../hooks/useAlgoliaRequestSearch";

const toWorkOrderString = (workOrder) => {
  if (typeof workOrder === "string") {
    return workOrder;
  }

  if (Array.isArray(workOrder)) {
    return workOrder.filter(Boolean).join(" / ");
  }

  if (workOrder === null || workOrder === undefined) {
    return "";
  }

  return String(workOrder);
};

const buildEquipmentPreviewLines = (equipmentDocs = []) => {
  return equipmentDocs
    .map((equipmentDoc) => {
      const equipmentData = equipmentDoc.data ? equipmentDoc.data() : equipmentDoc;
      const model = (equipmentData.model || "").toString().trim();
      const stock = (equipmentData.stock || "").toString().trim();
      const workOrder = (equipmentData.workOrder || "").toString().trim();
      return `M: ${model || "-"} • S: ${stock || "-"} • W: ${workOrder || "-"}`;
    })
    .filter(Boolean);
};

const hasEquipmentWorkOrders = (equipmentDocs = []) => {
  return equipmentDocs.some((equipmentDoc) => {
    const equipmentData = equipmentDoc.data ? equipmentDoc.data() : equipmentDoc;
    const workOrder = (equipmentData.workOrder || "").toString().trim();
    return workOrder !== "";
  });
};

function Row({ request }) {
  return <RequestRow request={request} disableEditing />;
}

export default function CompletedTable() {
  const [{ userProfile }] = useStateValue();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(30);
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [workOrderFilter, setWorkOrderFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [mobileView, setMobileView] = useState("table");
  const [searchedRequests, setSearchedRequests] = useState([]);
  const [isLoadingSearchedRequests, setIsLoadingSearchedRequests] = useState(false);
  const [equipmentPreviewByRequest, setEquipmentPreviewByRequest] = useState({});
  const [equipmentHasWorkOrderByRequest, setEquipmentHasWorkOrderByRequest] =
    useState({});
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [historyRequest, setHistoryRequest] = useState(null);
  const [historyActionFilter, setHistoryActionFilter] = useState(
    CHANGE_ACTION_FILTER_ALL,
  );
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const {
    matchedRequestIds,
    isSearching: isSearchLoading,
    searchError,
  } = useAlgoliaRequestSearch({
    queryText: searchText,
    branch: userProfile?.branch,
    status: "Completed",
  });
  const normalizedSearchText = searchText.trim();
  const normalizedSearchInput = searchInput.trim();
  const isSearchMode = normalizedSearchText !== "";
  const shouldUseAlgoliaResults = normalizedSearchText !== "" && !searchError;

  const filters = [30, 60, 90, "1 year"];

  const getStatusChipProps = (status) => {
    switch (status) {
      case "Requested":
        return { color: "primary", variant: "outlined" };
      case "Scheduled":
        return { color: "secondary", variant: "filled" };
      case "In Progress":
        return { color: "primary", variant: "filled" };
      case "Completed":
        return { color: "success", variant: "filled" };
      default:
        return { color: "default", variant: "outlined" };
    }
  };

  const fetch = useCallback(async () => {
    if (userProfile) {
      let dateRange;

      if (filter === "1 year") {
        dateRange = moment().subtract(1, "years").format("yyyyMMDD");
      } else {
        dateRange = moment().subtract(filter, "days").format("yyyyMMDD");
      }

      const requestsQuery = query(
        collection(db, "branches", userProfile?.branch, "requests"),
        where("status", "==", "Completed"),
        where("id", ">", dateRange),
        orderBy("id", "desc"),
      );

      const docSnapshot = await getDocs(requestsQuery);

      setRequests(
        docSnapshot.docs.map((document) => ({
          id: document.data().id,
          salesman: document.data().salesman,
          timestamp: document.data().timestamp,
          workOrder: document.data().workOrder,
          status: document.data().status,
          statusTimestamp: document.data().statusTimestamp,
          changeLog: document.data().changeLog,
        })),
      );
    }
  }, [userProfile, filter]);

  useEffect(() => {
    fetch();
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [fetch]);

  useEffect(() => {
    setMobileView(isMobile ? "cards" : "table");
  }, [isMobile]);

  useEffect(() => {
    let isCurrent = true;

    const loadSearchedRequests = async () => {
      if (!shouldUseAlgoliaResults || !userProfile?.branch) {
        if (isCurrent) {
          setSearchedRequests([]);
          setIsLoadingSearchedRequests(false);
        }
        return;
      }

      const uniqueIds = [...new Set(matchedRequestIds.map((id) => String(id)))];
      if (uniqueIds.length === 0) {
        if (isCurrent) {
          setSearchedRequests([]);
          setIsLoadingSearchedRequests(false);
        }
        return;
      }

      setIsLoadingSearchedRequests(true);

      try {
        const docSnapshots = await Promise.all(
          uniqueIds.map((requestId) =>
            getDoc(doc(db, "branches", userProfile.branch, "requests", requestId))
          )
        );

        const byId = new Map();
        docSnapshots.forEach((snapshot) => {
          if (!snapshot.exists()) {
            return;
          }

          const data = snapshot.data();
          if (data.status !== "Completed") {
            return;
          }

          byId.set(String(data.id || snapshot.id), {
            id: data.id,
            salesman: data.salesman,
            timestamp: data.timestamp,
            workOrder: data.workOrder,
            status: data.status,
            statusTimestamp: data.statusTimestamp,
            changeLog: data.changeLog,
          });
        });

        const orderedResults = uniqueIds
          .map((requestId) => byId.get(requestId))
          .filter(Boolean);

        if (isCurrent) {
          setSearchedRequests(orderedResults);
        }
      } finally {
        if (isCurrent) {
          setIsLoadingSearchedRequests(false);
        }
      }
    };

    loadSearchedRequests();

    return () => {
      isCurrent = false;
    };
  }, [matchedRequestIds, shouldUseAlgoliaResults, userProfile?.branch]);

  const visibleRequests = useMemo(() => {
    const queryTextLower = normalizedSearchText.toLowerCase();
    const sourceRequests = shouldUseAlgoliaResults ? searchedRequests : requests;
    const filtered = sourceRequests.filter((request) => {
      const workOrderText = toWorkOrderString(request.workOrder);
      const hasWorkOrder = workOrderText !== "";
      const workOrderMatch =
        workOrderFilter === "all" ||
        (workOrderFilter === "with_wo" && hasWorkOrder) ||
        (workOrderFilter === "without_wo" && !hasWorkOrder);

      const localSearchable = `${request.salesman} ${workOrderText} ${request.id}`.toLowerCase();
      const searchMatch =
        shouldUseAlgoliaResults ||
        queryTextLower === "" ||
        localSearchable.includes(queryTextLower);

      return workOrderMatch && searchMatch;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "oldest") return a.id.localeCompare(b.id);
      if (sortBy === "salesman") return a.salesman.localeCompare(b.salesman);
      return b.id.localeCompare(a.id);
    });
  }, [
    normalizedSearchText,
    requests,
    searchedRequests,
    shouldUseAlgoliaResults,
    workOrderFilter,
    sortBy,
  ]);

  useEffect(() => {
    let isCurrent = true;

    const loadEquipmentPreview = async () => {
      if (!userProfile?.branch || visibleRequests.length === 0) {
        return;
      }

      const missingRequestIds = visibleRequests
        .map((request) => String(request.id || ""))
        .filter(
          (requestId) =>
            requestId &&
            (equipmentPreviewByRequest[requestId] === undefined ||
              equipmentHasWorkOrderByRequest[requestId] === undefined),
        );

      if (missingRequestIds.length === 0) {
        return;
      }

      const previewEntries = await Promise.all(
        missingRequestIds.map(async (requestId) => {
          try {
            const equipmentSnapshot = await getDocs(
              collection(
                db,
                "branches",
                userProfile.branch,
                "requests",
                requestId,
                "equipment",
              ),
            );

            return [
              requestId,
              {
                preview: buildEquipmentPreviewLines(equipmentSnapshot.docs),
                hasEquipmentWorkOrder: hasEquipmentWorkOrders(
                  equipmentSnapshot.docs,
                ),
              },
            ];
          } catch (error) {
            return [
              requestId,
              {
                preview: [],
                hasEquipmentWorkOrder: false,
              },
            ];
          }
        }),
      );

      if (!isCurrent) {
        return;
      }

      setEquipmentPreviewByRequest((previous) => ({
        ...previous,
        ...Object.fromEntries(
          previewEntries.map(([requestId, value]) => [requestId, value.preview]),
        ),
      }));
      setEquipmentHasWorkOrderByRequest((previous) => ({
        ...previous,
        ...Object.fromEntries(
          previewEntries.map(([requestId, value]) => [
            requestId,
            value.hasEquipmentWorkOrder,
          ]),
        ),
      }));
    };

    loadEquipmentPreview();

    return () => {
      isCurrent = false;
    };
  }, [
    equipmentHasWorkOrderByRequest,
    equipmentPreviewByRequest,
    userProfile?.branch,
    visibleRequests,
  ]);

  const handleMobileViewChange = (_, nextView) => {
    if (nextView) {
      setMobileView(nextView);
    }
  };

  const loadRequestEquipment = async (request) => {
    const equipmentSnapshot = await getDocs(
      collection(
        db,
        "branches",
        userProfile.branch,
        "requests",
        request.id,
        "equipment",
      ),
    );

    return equipmentSnapshot.docs.map((equipmentDoc) => ({
      model: equipmentDoc.data().model,
      stock: equipmentDoc.data().stock,
      serial: equipmentDoc.data().serial,
      workOrder: equipmentDoc.data().workOrder,
      work: equipmentDoc.data().work,
      notes: equipmentDoc.data().notes,
      partNumbersSummary: equipmentDoc.data().partNumbersSummary || "",
    }));
  };

  const openDetails = async (request) => {
    if (!userProfile?.branch) {
      return;
    }

    setSelectedRequest(request);
    setSelectedEquipment([]);
    setDetailsOpen(true);
    setIsLoadingDetails(true);

    try {
      const equipment = await loadRequestEquipment(request);
      setSelectedEquipment(equipment);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const closeDetails = () => {
    setDetailsOpen(false);
  };

  const handlePrintRequest = async (request) => {
    if (!userProfile?.id || !userProfile?.branch) {
      return;
    }

    const equipment = await loadRequestEquipment(request);
    const printableRequest = {
      id: request.id || "",
      salesman: request.salesman || "",
      timestamp: request.timestamp || "",
      workOrder: request.workOrder || "",
      status: request.status || "",
      statusTimestamp: request.statusTimestamp || "",
      changeLog: request.changeLog || [],
    };

    await setDoc(
      doc(db, "users", userProfile.id, "pdf", "pdfData"),
      { request: printableRequest, equipment },
      { merge: true },
    );
    window.open("request-pdf", "_blank");
  };

  const handleOpenHistoryDialog = (request) => {
    setHistoryRequest(request);
    setHistoryActionFilter(CHANGE_ACTION_FILTER_ALL);
    setOpenHistoryDialog(true);
  };

  const handleCloseHistoryDialog = () => {
    setOpenHistoryDialog(false);
    setHistoryRequest(null);
    setHistoryActionFilter(CHANGE_ACTION_FILTER_ALL);
  };

  const historyChangeLog = useMemo(
    () => (historyRequest?.changeLog || []).map(normalizeChangeLogEntry),
    [historyRequest],
  );
  const historyActionOptions = useMemo(
    () => getChangeLogActionOptions(historyChangeLog),
    [historyChangeLog],
  );
  const visibleHistoryChangeLog = useMemo(() => {
    if (historyActionFilter === CHANGE_ACTION_FILTER_ALL) {
      return historyChangeLog;
    }

    return historyChangeLog.filter(
      (change) => change.actionType === historyActionFilter,
    );
  }, [historyActionFilter, historyChangeLog]);

  return (
    <React.Fragment>
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
          <TableToolbar
            title={
              isSearchMode
                ? "Completed Request Search"
                : "Completed Setup Requests"
            }
            subtitle={
              isSearchMode
                ? `Searching all completed history for ${userProfile?.branch}`
                : `Review recently closed requests for ${userProfile?.branch}`
            }
            searchValue={searchInput}
            onSearchChange={(event) => setSearchInput(event.target.value)}
            searchRequiresSubmit
            onSearchSubmit={() => setSearchText(normalizedSearchInput)}
            searchSubmitDisabled={normalizedSearchInput === normalizedSearchText}
            searchPlaceholder="Salesman, work order, ID, model, stock, serial"
            chips={[
              { label: "All", value: "all" },
              { label: "With WO", value: "with_wo" },
              { label: "No WO", value: "without_wo" },
            ]}
            selectedChip={workOrderFilter}
            onChipChange={setWorkOrderFilter}
            sortValue={sortBy}
            onSortChange={(event) => setSortBy(event.target.value)}
            sortOptions={[
              { label: "Newest", value: "newest" },
              { label: "Oldest", value: "oldest" },
              { label: "Salesman", value: "salesman" },
            ]}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 1 }}
          >
            {isSearchMode
              ? "Search mode is active. Results come from all completed history."
              : "Browse mode uses the date range filter below."}
          </Typography>

          <Box sx={{ mb: 1.25 }}>
            {!isSearchMode ? (
              <TextField
                size="small"
                id="filter"
                value={filter}
                label="Previous Range"
                onChange={(event) => setFilter(event.target.value)}
                select
                sx={{ minWidth: { xs: "100%", sm: 170 } }}
              >
                {filters.map((filterOption) => (
                  <MenuItem key={filterOption} value={filterOption}>
                    {filterOption.toString()}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <Typography variant="caption" color="text.secondary">
                {`${visibleRequests.length} match${
                  visibleRequests.length === 1 ? "" : "es"
                } across completed history`}
              </Typography>
            )}
            {normalizedSearchInput !== normalizedSearchText ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
                Press Search to run this query.
              </Typography>
            ) : null}
            {searchText.trim() !== "" && isSearchLoading ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.75 }}
              >
                Searching indexed requests...
              </Typography>
            ) : null}
            {shouldUseAlgoliaResults ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
                Date range is temporarily ignored while searching.
              </Typography>
            ) : null}
            {normalizedSearchText !== "" && isLoadingSearchedRequests ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
                Loading matched requests...
              </Typography>
            ) : null}
            {searchError ? (
              <Typography
                variant="caption"
                color="error"
                sx={{ display: "block", mt: 0.5 }}
              >
                {searchError}
              </Typography>
            ) : null}
          </Box>

          {isMobile ? (
            <ToggleButtonGroup
              size="small"
              exclusive
              value={mobileView}
              onChange={handleMobileViewChange}
              sx={{ mb: 1.25 }}
            >
              <ToggleButton value="cards">
                <ViewAgendaRounded sx={{ mr: 0.75, fontSize: 18 }} />
                Cards
              </ToggleButton>
              <ToggleButton value="table">
                <ViewListRounded sx={{ mr: 0.75, fontSize: 18 }} />
                Table
              </ToggleButton>
            </ToggleButtonGroup>
          ) : null}

          {visibleRequests.length === 0 ? (
            <Box
              sx={{
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 2,
                p: 3,
                textAlign: "center",
              }}
            >
              <Typography variant="subtitle1" color="text.primary">
                {isSearchMode
                  ? "No completed search matches found"
                  : "No completed requests found"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isSearchMode
                  ? "Try a different search term or work-order filter."
                  : "Try a different date range, search, or filter."}
              </Typography>
            </Box>
          ) : isMobile && mobileView === "cards" ? (
            <Box sx={{ display: "grid", gap: 1 }}>
              {visibleRequests.map((request) => {
                const lastChangeEntry =
                  request.changeLog && request.changeLog.length > 0
                    ? normalizeChangeLogEntry(
                        request.changeLog[request.changeLog.length - 1]
                      )
                    : null;
                const requestId = String(request.id || "");
                const equipmentPreview = equipmentPreviewByRequest[requestId] || [];
                const showLegacyRequestWorkOrder =
                  !equipmentHasWorkOrderByRequest[requestId];

                return (
                  <Card
                    key={request.id}
                    variant="outlined"
                    onClick={() => openDetails(request)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openDetails(request);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    sx={{
                      p: 1.5,
                      borderColor: "divider",
                      cursor: "pointer",
                      transition: "background-color 160ms ease, border-color 160ms ease",
                      "&:hover": {
                        borderColor: "primary.main",
                        backgroundColor: "action.hover",
                      },
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      spacing={1}
                    >
                      {equipmentPreview.length > 0 ? (
                        <Stack spacing={0.25} sx={{ justifyContent: "flex-start" }}>
                          {equipmentPreview.map((line, index) => (
                            <Typography
                              key={`completed-card-equipment-${request.id}-${index}`}
                              variant="body2"
                              sx={{ fontWeight: 500, lineHeight: 1.35 }}
                            >
                              {line}
                            </Typography>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No equipment listed
                        </Typography>
                      )}
                      <Chip
                        size="small"
                        label={request.status}
                        clickable
                        onClick={(event) => {
                          event.stopPropagation();
                          openDetails(request);
                        }}
                        {...getStatusChipProps(request.status)}
                      />
                    </Stack>

                    {showLegacyRequestWorkOrder ? (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 1 }}
                      >
                        WO: {toWorkOrderString(request.workOrder) || "-"}
                      </Typography>
                    ) : null}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 0.25, textAlign: "right" }}
                    >
                      {`Last updated by ${lastChangeEntry?.user || "Unknown"}${
                        lastChangeEntry?.timestamp
                          ? ` ${formatRelativeTimestamp(lastChangeEntry.timestamp)}`
                          : ""
                      }`}
                    </Typography>

                    <Divider sx={{ my: 1 }} />

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Submitted by: {request.salesman}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block" }}
                        >
                          {formatTimestampWithRelative(request.timestamp)}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.25}>
                        <Tooltip title="Show Changes">
                          <IconButton
                            size="small"
                            aria-label={`Show request history ${request.id}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenHistoryDialog(request);
                            }}
                          >
                            <HistoryOutlined />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Print">
                          <IconButton
                            size="small"
                            aria-label={`Print request ${request.id}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              handlePrintRequest(request);
                            }}
                          >
                            <PrintOutlined />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </Card>
                );
              })}
            </Box>
          ) : (
            <>
              <TableContainer
                component={Paper}
                sx={{
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  overflowX: "auto",
                  maxHeight: { xs: "68vh", md: "72vh" },
                }}
              >
                <Table
                  size="small"
                  aria-label="collapsible table"
                  stickyHeader
                  sx={{
                    minWidth: 760,
                    "& .MuiTableHead-root .MuiTableCell-root": {
                      bgcolor: "background.paper",
                      zIndex: 3,
                    },
                    "& .MuiTableHead-root .MuiTableCell-root:last-of-type": {
                      position: "sticky",
                      right: 0,
                      zIndex: 4,
                      borderLeft: "1px solid",
                      borderColor: "divider",
                    },
                  }}
                >
                  <RequestsTableHeaderView />
                  <TableBody>
                    {visibleRequests.map((request) => (
                      <Row key={request.id} request={request} />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: { xs: "block", sm: "none" }, mt: 0.75 }}
              >
                Swipe horizontally to see all table columns.
              </Typography>
            </>
          )}
        </Card>
      )}

      <Drawer anchor="bottom" open={detailsOpen} onClose={closeDetails}>
        <Box sx={{ p: 2, maxHeight: "80vh", overflowY: "auto" }}>
          {selectedRequest ? (
            <>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 0.5 }}>
                <IconButton size="small" aria-label="Close request details" onClick={closeDetails}>
                  <CloseRounded />
                </IconButton>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Typography variant="h6" color="primary">
                  Request Details
                </Typography>
                <Chip
                  size="small"
                  label={selectedRequest.status}
                  {...getStatusChipProps(selectedRequest.status)}
                />
              </Box>

              <Typography variant="body2">
                Salesman: {selectedRequest.salesman}
              </Typography>
              <Typography variant="body2">
                Work Order: {toWorkOrderString(selectedRequest.workOrder) || "-"}
              </Typography>
              <Typography variant="body2">
                Status Time: {formatTimestampWithRelative(selectedRequest.statusTimestamp)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {`Request ID: ${selectedRequest.id}`}
              </Typography>

              <Divider sx={{ my: 1.5 }} />

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Equipment
              </Typography>
              {isLoadingDetails ? (
                <Typography variant="body2" color="text.secondary">
                  Loading equipment...
                </Typography>
              ) : selectedEquipment.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No equipment found for this request.
                </Typography>
              ) : (
                <Box sx={{ display: "grid", gap: 1 }}>
                  {selectedEquipment.map((item, index) => (
                    <Card key={`${item.stock}-${index}`} variant="outlined" sx={{ p: 1.25 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.model}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        {`Stock: ${item.stock} | Serial: ${item.serial}`}
                      </Typography>
                      <Typography variant="caption" sx={{ display: "block", mt: 0.25 }}>
                        {`WO: ${item.workOrder || "-"}`}
                      </Typography>
                      <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                        {`Work: ${item.work || "-"}`}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 0.25 }}
                      >
                        {`Notes: ${item.notes || "-"}`}
                      </Typography>
                    </Card>
                  ))}
                </Box>
              )}

            </>
          ) : null}
        </Box>
      </Drawer>

      <Dialog
        onClose={handleCloseHistoryDialog}
        open={openHistoryDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            height: { xs: "78vh", sm: 560 },
            maxHeight: "78vh",
          },
        }}
      >
        <DialogTitle>Request Change History</DialogTitle>
        <Box sx={{ px: 2, pb: 1 }}>
          <TextField
            size="small"
            select
            fullWidth
            label="Action Type"
            value={historyActionFilter}
            onChange={(event) => setHistoryActionFilter(event.target.value)}
          >
            {historyActionOptions.map((option) => (
              <MenuItem
                key={`history-action-${option.value}`}
                value={option.value}
              >
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Box sx={{ px: 1.25, pb: 1.5, height: "100%", overflowY: "auto" }}>
          <Stack spacing={1.25}>
            {visibleHistoryChangeLog.map((change, index) => (
              <Box key={`${change.timestamp}-${change.user}-${index}`}>
                <Typography variant="caption" color="text.secondary">
                  {formatTimestampWithRelative(change.timestamp)}
                </Typography>
                <Typography variant="body2">{change.user}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {change.summary}
                </Typography>
                {change.details.length > 0
                  ? change.details.map((detail, detailIndex) => (
                      <Typography
                        key={`${change.timestamp}-detail-${detailIndex}`}
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        {detail}
                      </Typography>
                    ))
                  : null}
                {index + 1 !== visibleHistoryChangeLog.length ? (
                  <Divider sx={{ mt: 1 }} />
                ) : null}
              </Box>
            ))}
          </Stack>
        </Box>
      </Dialog>

    </React.Fragment>
  );
}
