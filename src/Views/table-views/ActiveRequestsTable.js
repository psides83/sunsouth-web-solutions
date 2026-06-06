import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStateValue } from "../../state-management/StateProvider";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import moment from "moment";
import HomeSkeleton from "../../components/HomeSkeleton";
import "../../styles/Table.css";
import { Link } from "react-router-dom";
import AddRequestView from "../AddRequestView";
import { RequestsTableHeaderView } from "../../components/TableHeaderViews";
import RequestRow from "./ActiveRequestRow";
import TableToolbar from "../../components/TableToolbar";
import { sendWorkOrderEmail } from "../../services/email-service";
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Drawer,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
  useTheme,
  Table,
  TableBody,
  TableContainer,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AddRounded,
  CloseRounded,
  EditRounded,
  HistoryOutlined,
  PrintOutlined,
  ViewAgendaRounded,
  ViewListRounded,
} from "@mui/icons-material";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
} from "@mui/lab";
import {
  formatRelativeTimestamp,
  formatTimestampWithRelative,
} from "../../utils/dateTime";
import {
  CHANGE_ACTION_FILTER_ALL,
  CHANGE_ACTIONS,
  createChangeLogEntry,
  getChangeLogActionOptions,
  normalizeChangeLogEntry,
} from "../../utils/changeLog";
import {
  normalizePartNumbers,
  toPartNumberDocId,
  toPartNumberSummary,
} from "../../utils/partNumbers";
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

export default function ActiveRequestsTable() {
  const [{ userProfile }] = useStateValue();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddRequestView, setOpenAddRequestView] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [equipmentSearchIndex, setEquipmentSearchIndex] = useState({});
  const [equipmentPreviewByRequest, setEquipmentPreviewByRequest] = useState({});
  const [equipmentHasWorkOrderByRequest, setEquipmentHasWorkOrderByRequest] =
    useState({});
  const [mobileView, setMobileView] = useState("table");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [historyRequest, setHistoryRequest] = useState(null);
  const [historyActionFilter, setHistoryActionFilter] = useState(
    CHANGE_ACTION_FILTER_ALL,
  );
  const [openWorkOrderDialog, setOpenWorkOrderDialog] = useState(false);
  const [workOrderRequest, setWorkOrderRequest] = useState(null);
  const [workOrderEquipment, setWorkOrderEquipment] = useState([]);
  const [equipmentWorkOrders, setEquipmentWorkOrders] = useState({});
  const [openEditEquipmentDialog, setOpenEditEquipmentDialog] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [openAddEquipmentDialog, setOpenAddEquipmentDialog] = useState(false);
  const [openNoPartsDialog, setOpenNoPartsDialog] = useState(false);
  const noPartsDialogResolverRef = useRef(null);
  const [completedSearchResults, setCompletedSearchResults] = useState([]);
  const [isLoadingCompletedSearchResults, setIsLoadingCompletedSearchResults] =
    useState(false);
  const [newEquipment, setNewEquipment] = useState({
    model: "",
    stock: "",
    serial: "",
    workOrder: "",
    work: "",
    notes: "",
    partNumbersList: [""],
  });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const {
    matchedRequestIds: matchedCompletedRequestIds,
    isSearching: isSearchingCompleted,
    searchError: completedSearchError,
  } = useAlgoliaRequestSearch({
    queryText: searchText,
    branch: userProfile?.branch,
    status: "Completed",
  });
  const isCompletedSearchMode = searchText.trim() !== "";
  const normalizedSearchInput = searchInput.trim();
  const normalizedSearchText = searchText.trim();

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

  const handleCloseAddRequestView = useCallback(() => {
    setOpenAddRequestView(false);
  }, []);

  const handleToggleAddRequestView = useCallback(() => {
    setOpenAddRequestView((previous) => !previous);
  }, []);

  const handleToolbarSearchChange = (event) => {
    const nextValue = event.target.value;
    setSearchInput(nextValue);

    if (nextValue.trim() === "") {
      setSearchText("");
      setCompletedSearchResults([]);
      setIsLoadingCompletedSearchResults(false);
    }
  };

  const fetch = useCallback(async () => {
    if (!userProfile) {
      return;
    }

    const requestsQuery = query(
      collection(db, "branches", userProfile?.branch, "requests"),
      where("status", "!=", "Completed"),
    );

    onSnapshot(requestsQuery, (querySnapshot) => {
      setRequests(
        querySnapshot.docs.map((document) => ({
          id: document.data().id,
          salesman: document.data().salesman,
          timestamp: document.data().timestamp,
          workOrder: document.data().workOrder,
          status: document.data().status,
          statusTimestamp: document.data().statusTimestamp,
          changeLog: document.data().changeLog,
        })),
      );
      setTimeout(() => {
        setLoading(false);
      }, 500);
    });
  }, [userProfile]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    setMobileView(isMobile ? "cards" : "table");
  }, [isMobile]);

  useEffect(() => {
    let isCurrent = true;

    const loadCompletedSearchResults = async () => {
      const normalizedQuery = searchText.trim();
      if (normalizedQuery === "" || !userProfile?.branch) {
        if (isCurrent) {
          setCompletedSearchResults([]);
          setIsLoadingCompletedSearchResults(false);
        }
        return;
      }

      if (completedSearchError) {
        if (isCurrent) {
          setCompletedSearchResults([]);
          setIsLoadingCompletedSearchResults(false);
        }
        return;
      }

      const uniqueIds = [
        ...new Set(matchedCompletedRequestIds.map((id) => String(id))),
      ];
      if (uniqueIds.length === 0) {
        if (isCurrent) {
          setCompletedSearchResults([]);
          setIsLoadingCompletedSearchResults(false);
        }
        return;
      }

      setIsLoadingCompletedSearchResults(true);

      try {
        const snapshots = await Promise.all(
          uniqueIds.map((requestId) =>
            getDoc(
              doc(db, "branches", userProfile.branch, "requests", requestId),
            ),
          ),
        );

        const byId = new Map();
        snapshots.forEach((snapshot) => {
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
            changeLog: data.changeLog || [],
          });
        });

        const orderedResults = uniqueIds
          .map((id) => byId.get(id))
          .filter(Boolean);

        if (isCurrent) {
          setCompletedSearchResults(orderedResults);
        }
      } finally {
        if (isCurrent) {
          setIsLoadingCompletedSearchResults(false);
        }
      }
    };

    loadCompletedSearchResults();

    return () => {
      isCurrent = false;
    };
  }, [
    searchText,
    completedSearchError,
    matchedCompletedRequestIds,
    userProfile?.branch,
  ]);

  useEffect(() => {
    let isCurrent = true;

    const buildEquipmentSearchIndex = async () => {
      if (!userProfile?.branch || requests.length === 0) {
        if (isCurrent) {
          setEquipmentSearchIndex({});
          setEquipmentPreviewByRequest({});
          setEquipmentHasWorkOrderByRequest({});
        }
        return;
      }

      const entries = await Promise.all(
        requests.map(async (request) => {
          try {
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

            const equipmentSearchText = equipmentSnapshot.docs
              .map((equipmentDoc) => {
                const equipmentData = equipmentDoc.data();
                return [
                  equipmentData.model,
                  equipmentData.stock,
                  equipmentData.serial,
                  equipmentData.workOrder,
                  equipmentData.work,
                  equipmentData.notes,
                ]
                  .filter(Boolean)
                  .join(" ");
              })
              .join(" ")
              .toLowerCase();
            const equipmentPreview = buildEquipmentPreviewLines(
              equipmentSnapshot.docs,
            );
            const hasEquipmentWorkOrder = hasEquipmentWorkOrders(
              equipmentSnapshot.docs,
            );

            return [
              request.id,
              {
                searchText: equipmentSearchText,
                preview: equipmentPreview,
                hasEquipmentWorkOrder,
              },
            ];
          } catch (error) {
            return [
              request.id,
              {
                searchText: "",
                preview: [],
                hasEquipmentWorkOrder: false,
              },
            ];
          }
        }),
      );

      if (isCurrent) {
        const byRequest = Object.fromEntries(entries);
        setEquipmentSearchIndex(
          Object.fromEntries(
            Object.entries(byRequest).map(([requestId, value]) => [
              requestId,
              value.searchText,
            ]),
          ),
        );
        setEquipmentPreviewByRequest(
          Object.fromEntries(
            Object.entries(byRequest).map(([requestId, value]) => [
              requestId,
              value.preview,
            ]),
          ),
        );
        setEquipmentHasWorkOrderByRequest(
          Object.fromEntries(
            Object.entries(byRequest).map(([requestId, value]) => [
              requestId,
              value.hasEquipmentWorkOrder,
            ]),
          ),
        );
      }
    };

    buildEquipmentSearchIndex();

    return () => {
      isCurrent = false;
    };
  }, [requests, userProfile?.branch]);

  useEffect(() => {
    let isCurrent = true;

    const hydrateCompletedEquipmentPreview = async () => {
      if (!isCompletedSearchMode || !userProfile?.branch) {
        return;
      }

      const missingRequests = completedSearchResults.filter((request) => {
        const requestId = String(request.id || "");
        return requestId && !equipmentPreviewByRequest[requestId];
      });

      if (missingRequests.length === 0) {
        return;
      }

      const previewEntries = await Promise.all(
        missingRequests.map(async (request) => {
          const requestId = String(request.id || "");
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

    hydrateCompletedEquipmentPreview();

    return () => {
      isCurrent = false;
    };
  }, [
    equipmentPreviewByRequest,
    completedSearchResults,
    isCompletedSearchMode,
    userProfile?.branch,
  ]);

  const visibleRequests = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const filtered = requests.filter((request) => {
      const statusMatch =
        statusFilter === "all" ||
        request.status.toLowerCase() === statusFilter.toLowerCase();

      const searchable =
        `${request.salesman} ${request.workOrder} ${request.id} ${request.status} ${
          equipmentSearchIndex[request.id] || ""
        }`.toLowerCase();
      const searchMatch = query === "" || searchable.includes(query);

      return statusMatch && searchMatch;
    });

    return [...filtered].sort((a, b) => a.id.localeCompare(b.id));
  }, [requests, searchText, statusFilter, equipmentSearchIndex]);

  const visibleCompletedSearchResults = useMemo(() => {
    return [...completedSearchResults].sort((a, b) => b.id.localeCompare(a.id));
  }, [completedSearchResults]);

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
    const byStock = new Map();
    equipmentSnapshot.docs.forEach((equipmentDoc) => {
      const data = equipmentDoc.data();
      const stock = data.stock || "";
      const candidate = {
        model: data.model || "",
        stock,
        serial: data.serial || "",
        workOrder: data.workOrder || "",
        work: data.work || "",
        notes: data.notes || "",
        partNumbersSummary: data.partNumbersSummary || "",
        requestID: request.id,
        _docId: equipmentDoc.id,
      };

      const existing = byStock.get(stock);
      if (!existing) {
        byStock.set(stock, candidate);
        return;
      }

      // Prefer canonical record whose document id matches stock.
      if (existing._docId !== existing.stock && candidate._docId === candidate.stock) {
        byStock.set(stock, candidate);
      }
    });

    return Array.from(byStock.values()).map(({ _docId, ...item }) => item);
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

  const compileRequestWorkOrder = (equipmentList, workOrderMap) => {
    return equipmentList
      .map((item) => {
        const workOrder = (workOrderMap[item.stock] || "").trim();
        if (!workOrder) {
          return null;
        }
        return `${workOrder}: ${item.model} - ${item.stock}`;
      })
      .filter(Boolean)
      .join(" / ");
  };

  const handleOpenWorkOrderDialog = async (request) => {
    const equipment = await loadRequestEquipment(request);
    const nextWorkOrders = {};
    equipment.forEach((item) => {
      nextWorkOrders[item.stock] = item.workOrder || "";
    });

    setWorkOrderRequest(request);
    setWorkOrderEquipment(equipment);
    setEquipmentWorkOrders(nextWorkOrders);
    setOpenWorkOrderDialog(true);
  };

  const handleCloseWorkOrderDialog = () => {
    setOpenWorkOrderDialog(false);
    setWorkOrderRequest(null);
    setWorkOrderEquipment([]);
    setEquipmentWorkOrders({});
  };

  const saveWorkOrderFromCard = async () => {
    if (!workOrderRequest) {
      return;
    }

    const hasWorkOrderChanges = workOrderEquipment.some(
      (item) =>
        (item.workOrder || "").trim() !==
        (equipmentWorkOrders[item.stock] || "").trim(),
    );

    if (!hasWorkOrderChanges) {
      handleCloseWorkOrderDialog();
      return;
    }

    const fullName = `${userProfile?.firstName} ${userProfile?.lastName}`;
    const compiledWorkOrder = compileRequestWorkOrder(
      workOrderEquipment,
      equipmentWorkOrders,
    );
    const hadEquipmentWorkOrders = workOrderEquipment.some((item) =>
      Boolean((item.workOrder || "").trim()),
    );
    const nextRequestWorkOrder =
      !compiledWorkOrder && !hadEquipmentWorkOrders
        ? workOrderRequest.workOrder || ""
        : compiledWorkOrder;

    const nextChangeLog = [...(workOrderRequest.changeLog || [])];
    nextChangeLog.push(
      createChangeLogEntry({
        user: fullName,
        actionType: CHANGE_ACTIONS.WORK_ORDER_UPDATED,
        summary: compiledWorkOrder
          ? "Updated equipment work orders"
          : "Cleared equipment work orders",
      }),
    );

    await Promise.all(
      workOrderEquipment.map((item) =>
        setDoc(
          doc(
            db,
            "branches",
            userProfile.branch,
            "requests",
            workOrderRequest.id,
            "equipment",
            item.stock,
          ),
          { workOrder: (equipmentWorkOrders[item.stock] || "").trim() },
          { merge: true },
        ),
      ),
    );

    await setDoc(
      doc(db, "branches", userProfile.branch, "requests", workOrderRequest.id),
      { workOrder: nextRequestWorkOrder, changeLog: nextChangeLog },
      { merge: true },
    );

    sendWorkOrderEmail(
      workOrderEquipment,
      workOrderRequest,
      nextRequestWorkOrder,
      fullName,
      "",
      userProfile,
    );

    const refreshedRequests = requests.map((item) =>
      item.id === workOrderRequest.id
        ? { ...item, workOrder: nextRequestWorkOrder, changeLog: nextChangeLog }
        : item,
    );
    setRequests(refreshedRequests);
    setSelectedRequest((previous) =>
      previous && previous.id === workOrderRequest.id
        ? {
            ...previous,
            workOrder: nextRequestWorkOrder,
            changeLog: nextChangeLog,
          }
        : previous,
    );

    const refreshedEquipment = await loadRequestEquipment(workOrderRequest);
    setWorkOrderEquipment(refreshedEquipment);
    if (selectedRequest?.id === workOrderRequest.id) {
      setSelectedEquipment(refreshedEquipment);
    }

    handleCloseWorkOrderDialog();
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

    setDoc(
      doc(db, "users", userProfile.id, "pdf", "pdfData"),
      { request: printableRequest, equipment },
      { merge: true },
    );
    window.open("request-pdf", "_blank");
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

  const handleOpenEditEquipmentDialog = async (item) => {
    const originalStock = item.originalStock || item.stock;
    let existingPartNumbers = [""];
    try {
      const partNumbersSnapshot = await getDocs(
        collection(
          db,
          "branches",
          userProfile.branch,
          "requests",
          selectedRequest.id,
          "equipment",
          originalStock,
          "partNumbers",
        ),
      );
      const parsed = partNumbersSnapshot.docs
        .map((partDoc) => partDoc.data().partNumber || "")
        .filter(Boolean);
      existingPartNumbers = parsed.length > 0 ? parsed : [""];
    } catch (error) {
      existingPartNumbers = [""];
    }

    setEditingEquipment({
      ...item,
      originalStock,
      partNumbersList: existingPartNumbers,
    });
    setOpenEditEquipmentDialog(true);
  };

  const handleCloseEditEquipmentDialog = () => {
    setOpenEditEquipmentDialog(false);
    setEditingEquipment(null);
  };

  const handleEditEquipmentField = (field, value) => {
    setEditingEquipment((previous) => ({ ...previous, [field]: value }));
  };

  const handleEditPartNumberRowChange = (index, value) => {
    setEditingEquipment((previous) => {
      if (!previous) {
        return previous;
      }
      const nextPartNumbers = [...(previous.partNumbersList || [""])];
      nextPartNumbers[index] = value.toUpperCase();
      return { ...previous, partNumbersList: nextPartNumbers };
    });
  };

  const handleAddEditPartNumberRow = () => {
    setEditingEquipment((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        partNumbersList: [...(previous.partNumbersList || [""]), ""],
      };
    });
  };

  const handleRemoveEditPartNumberRow = (index) => {
    setEditingEquipment((previous) => {
      if (!previous) {
        return previous;
      }
      const current = previous.partNumbersList || [""];
      if (current.length <= 1) {
        return { ...previous, partNumbersList: [""] };
      }

      return {
        ...previous,
        partNumbersList: current.filter((_, rowIndex) => rowIndex !== index),
      };
    });
  };

  const saveEditedEquipment = async () => {
    if (!editingEquipment || !selectedRequest) {
      return;
    }

    const nextPartNumbers = normalizePartNumbers(
      editingEquipment.partNumbersList || [""],
    );
    const originalStock = editingEquipment.originalStock || editingEquipment.stock;
    const nextStock = editingEquipment.stock;
    const stockChanged = originalStock !== nextStock;

    await setDoc(
      doc(
        db,
        "branches",
        userProfile.branch,
        "requests",
        selectedRequest.id,
        "equipment",
        nextStock,
      ),
      {
        model: editingEquipment.model,
        stock: nextStock,
        serial: editingEquipment.serial,
        workOrder: editingEquipment.workOrder || "",
        work: editingEquipment.work,
        notes: editingEquipment.notes,
        partNumbersSummary: toPartNumberSummary(nextPartNumbers),
      },
      { merge: true },
    );

    const partNumbersCollectionRef = collection(
      db,
      "branches",
      userProfile.branch,
      "requests",
      selectedRequest.id,
      "equipment",
      nextStock,
      "partNumbers",
    );
    const existingPartNumbersSnapshot = await getDocs(partNumbersCollectionRef);
    const nextPartNumberIds = new Set(
      nextPartNumbers.map((partNumber) => toPartNumberDocId(partNumber)),
    );

    await Promise.all(
      existingPartNumbersSnapshot.docs
        .filter((partDoc) => !nextPartNumberIds.has(partDoc.id))
        .map((partDoc) =>
          deleteDoc(
            doc(
              db,
              "branches",
              userProfile.branch,
              "requests",
              selectedRequest.id,
              "equipment",
              nextStock,
              "partNumbers",
              partDoc.id,
            ),
          ),
        ),
    );

    await Promise.all(
      nextPartNumbers.map((partNumber) =>
        setDoc(
          doc(
            db,
            "branches",
            userProfile.branch,
            "requests",
            selectedRequest.id,
            "equipment",
            nextStock,
            "partNumbers",
            toPartNumberDocId(partNumber),
          ),
          {
            partNumber,
            requestID: selectedRequest.id,
            equipmentStock: nextStock,
          },
          { merge: true },
        ),
      ),
    );

    if (stockChanged) {
      const legacyPartsSnapshot = await getDocs(
        collection(
          db,
          "branches",
          userProfile.branch,
          "requests",
          selectedRequest.id,
          "equipment",
          originalStock,
          "partNumbers",
        ),
      );

      await Promise.all(
        legacyPartsSnapshot.docs.map((partDoc) =>
          deleteDoc(
            doc(
              db,
              "branches",
              userProfile.branch,
              "requests",
              selectedRequest.id,
              "equipment",
              originalStock,
              "partNumbers",
              partDoc.id,
            ),
          ),
        ),
      );

      await deleteDoc(
        doc(
          db,
          "branches",
          userProfile.branch,
          "requests",
          selectedRequest.id,
          "equipment",
          originalStock,
        ),
      );
    }

    const refreshed = await loadRequestEquipment(selectedRequest);
    setSelectedEquipment(refreshed);
    handleCloseEditEquipmentDialog();
  };

  const handleOpenAddEquipmentDialog = () => {
    setNewEquipment({
      model: "",
      stock: "",
      serial: "",
      workOrder: "",
      work: "",
      notes: "",
      partNumbersList: [""],
    });
    setOpenAddEquipmentDialog(true);
  };

  const handleCloseAddEquipmentDialog = () => {
    setOpenAddEquipmentDialog(false);
  };

  const handleNewEquipmentField = (field, value) => {
    setNewEquipment((previous) => ({ ...previous, [field]: value }));
  };

  const confirmNoPartsRequired = () =>
    new Promise((resolve) => {
      noPartsDialogResolverRef.current = resolve;
      setOpenNoPartsDialog(true);
    });

  const closeNoPartsDialog = (confirmed) => {
    setOpenNoPartsDialog(false);
    if (noPartsDialogResolverRef.current) {
      noPartsDialogResolverRef.current(confirmed);
      noPartsDialogResolverRef.current = null;
    }
  };

  const handlePartNumberRowChange = (index, value) => {
    setNewEquipment((previous) => {
      const nextPartNumbers = [...(previous.partNumbersList || [""])];
      nextPartNumbers[index] = value.toUpperCase();
      return { ...previous, partNumbersList: nextPartNumbers };
    });
  };

  const handleAddPartNumberRow = () => {
    setNewEquipment((previous) => ({
      ...previous,
      partNumbersList: [...(previous.partNumbersList || [""]), ""],
    }));
  };

  const handleRemovePartNumberRow = (index) => {
    setNewEquipment((previous) => {
      const current = previous.partNumbersList || [""];
      if (current.length <= 1) {
        return { ...previous, partNumbersList: [""] };
      }

      return {
        ...previous,
        partNumbersList: current.filter((_, rowIndex) => rowIndex !== index),
      };
    });
  };

  const saveNewEquipment = async () => {
    if (!selectedRequest) {
      return;
    }

    const createdEquipment = {
      requestID: selectedRequest.id,
      timestamp: moment().format("DD-MMM-yyyy hh:mmA"),
      model: newEquipment.model,
      stock: newEquipment.stock,
      serial: newEquipment.serial,
      workOrder: newEquipment.workOrder || "",
      work: newEquipment.work,
      notes: newEquipment.notes,
      partNumbersSummary: "",
      changeLog: [
        createChangeLogEntry({
          user: `${userProfile?.firstName} ${userProfile?.lastName}`,
          actionType: CHANGE_ACTIONS.EQUIPMENT_ADDED,
          summary: "Equipment record created",
        }),
      ],
    };
    const parsedPartNumbers = normalizePartNumbers(
      newEquipment.partNumbersList || [""],
    );
    if (parsedPartNumbers.length === 0) {
      const confirmedNoParts = await confirmNoPartsRequired();
      if (!confirmedNoParts) {
        return;
      }
    }
    createdEquipment.partNumbersSummary = toPartNumberSummary(parsedPartNumbers);

    if (
      createdEquipment.model === "" ||
      createdEquipment.stock === "" ||
      createdEquipment.serial === "" ||
      createdEquipment.work === ""
    ) {
      return;
    }

    await setDoc(
      doc(
        db,
        "branches",
        userProfile.branch,
        "requests",
        selectedRequest.id,
        "equipment",
        createdEquipment.stock,
      ),
      createdEquipment,
      { merge: true },
    );
    for (const partNumber of parsedPartNumbers) {
      await setDoc(
        doc(
          db,
          "branches",
          userProfile.branch,
          "requests",
          selectedRequest.id,
          "equipment",
          createdEquipment.stock,
          "partNumbers",
          toPartNumberDocId(partNumber),
        ),
        {
          partNumber,
          timestamp: createdEquipment.timestamp,
          requestID: selectedRequest.id,
          equipmentStock: createdEquipment.stock,
        },
        { merge: true },
      );
    }

    const fullName = `${userProfile?.firstName} ${userProfile?.lastName}`;
    const nextChangeLog = [...(selectedRequest.changeLog || [])];
    nextChangeLog.push(
      createChangeLogEntry({
        user: fullName,
        actionType: CHANGE_ACTIONS.EQUIPMENT_ADDED,
        summary: `Equipment model ${createdEquipment.model} added to the request`,
      }),
    );

    await setDoc(
      doc(db, "branches", userProfile.branch, "requests", selectedRequest.id),
      { changeLog: nextChangeLog },
      { merge: true },
    );

    setRequests((previous) =>
      previous.map((item) =>
        item.id === selectedRequest.id
          ? { ...item, changeLog: nextChangeLog }
          : item,
      ),
    );
    setSelectedRequest((previous) =>
      previous && previous.id === selectedRequest.id
        ? { ...previous, changeLog: nextChangeLog }
        : previous,
    );

    const refreshed = await loadRequestEquipment(selectedRequest);
    setSelectedEquipment(refreshed);
    setOpenAddEquipmentDialog(false);
  };

  useEffect(() => {
    const isTypingTarget = (target) => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      const tagName = target.tagName.toLowerCase();
      return (
        target.isContentEditable ||
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select"
      );
    };

    const focusNextRequestRow = () => {
      if (document.querySelector('[role="dialog"]')) {
        return;
      }

      const rowButtons = Array.from(
        document.querySelectorAll('[data-request-edit-btn="true"]'),
      );

      if (rowButtons.length === 0) {
        return;
      }

      const currentIndex = rowButtons.findIndex(
        (button) => button === document.activeElement,
      );
      const nextButton =
        currentIndex === -1
          ? rowButtons[0]
          : rowButtons[(currentIndex + 1) % rowButtons.length];

      nextButton.focus();
    };

    const onKeyDown = (event) => {
      const saveShortcut =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s";

      if (saveShortcut) {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("request-shortcut-save"));
        return;
      }

      if (event.key === "Escape") {
        if (openAddRequestView) {
          event.preventDefault();
          handleCloseAddRequestView();
          return;
        }

        window.dispatchEvent(new CustomEvent("request-shortcut-close"));
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      if (event.altKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        handleToggleAddRequestView();
        return;
      }

      if (event.altKey && event.key === "ArrowDown") {
        event.preventDefault();
        focusNextRequestRow();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    openAddRequestView,
    handleCloseAddRequestView,
    handleToggleAddRequestView,
  ]);

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
              isCompletedSearchMode
                ? "Completed Request Search"
                : "Active Setup Requests"
            }
            subtitle={
              isCompletedSearchMode
                ? `Searching all completed history for ${userProfile?.branch}`
                : ``
            }
            searchLabel="Search Completed Requests"
            searchValue={searchInput}
            onSearchChange={handleToolbarSearchChange}
            searchRequiresSubmit
            onSearchSubmit={() => setSearchText(normalizedSearchInput)}
            searchSubmitDisabled={
              normalizedSearchInput === normalizedSearchText
            }
            searchPlaceholder="Salesman, work order, model, stock, serial"
            chips={
              isCompletedSearchMode
                ? []
                : [
                    { label: "All", value: "all" },
                    { label: "Requested", value: "requested" },
                    { label: "In Progress", value: "in progress" },
                  ]
            }
            selectedChip={statusFilter}
            onChipChange={setStatusFilter}
            primaryActionLabel="New Request"
            primaryActionIcon={<AddRounded />}
            onPrimaryAction={handleToggleAddRequestView}
          />
          {isCompletedSearchMode ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1 }}
            >
              Search mode active: browsing completed history from this page.
            </Typography>
          ) : (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1 }}
            >
              Tip: Use search to find completed requests from history.
            </Typography>
          )}
          {normalizedSearchInput !== normalizedSearchText ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1 }}
            >
              Press Search to run this query.
            </Typography>
          ) : null}

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

          <Dialog
            onClose={handleCloseAddRequestView}
            open={openAddRequestView}
            fullWidth
            maxWidth="sm"
            fullScreen={isMobile}
          >
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <AddRequestView onClose={handleCloseAddRequestView} />
            </Box>
          </Dialog>

          {isCompletedSearchMode ? (
            <>
              {isSearchingCompleted || isLoadingCompletedSearchResults ? (
                <HomeSkeleton />
              ) : null}
              {completedSearchError ? (
                <Typography variant="caption" color="error">
                  {completedSearchError}
                </Typography>
              ) : null}
              {!isSearchingCompleted &&
              !isLoadingCompletedSearchResults &&
              visibleCompletedSearchResults.length === 0 ? (
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
                    No completed requests matched your search
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try a different search term.
                  </Typography>
                </Box>
              ) : isMobile && mobileView === "cards" ? (
                <Box sx={{ display: "grid", gap: 1 }}>
                  {visibleCompletedSearchResults.map((request) => {
                    const lastChangeEntry =
                      request.changeLog && request.changeLog.length > 0
                        ? normalizeChangeLogEntry(
                            request.changeLog[request.changeLog.length - 1],
                          )
                        : null;
                    const requestId = String(request.id || "");
                    const equipmentPreview =
                      equipmentPreviewByRequest[requestId] || [];
                    const showLegacyRequestWorkOrder =
                      !equipmentHasWorkOrderByRequest[requestId];

                    return (
                      <Card
                        key={`completed-search-card-${request.id}`}
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
                            <Stack
                              spacing={0.25}
                              sx={{ justifyContent: "flex-start" }}
                            >
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
                            {/* Completed search results are read-only for editing. */}
                          </Stack>
                        </Box>
                      </Card>
                    );
                  })}
                </Box>
              ) : (
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
                    aria-label="completed-search-table"
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
                      {visibleCompletedSearchResults.map((request) => (
                        <RequestRow
                          key={`completed-search-row-${request.id}`}
                          request={request}
                          disableEditing
                        />
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          ) : visibleRequests.length === 0 ? (
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
                {requests.length === 0
                  ? "No active requests yet"
                  : "No requests match your filters"}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1.5 }}
              >
                {requests.length === 0
                  ? "Create your first setup request to get started."
                  : "Try clearing search or selecting a different status."}
              </Typography>
              {requests.length === 0 ? (
                <Button
                  variant="contained"
                  startIcon={<AddRounded />}
                  onClick={handleToggleAddRequestView}
                >
                  New Request
                </Button>
              ) : null}
            </Box>
          ) : isMobile && mobileView === "cards" ? (
            <Box sx={{ display: "grid", gap: 1 }}>
              {visibleRequests.map((request) => {
                const lastChangeEntry =
                  request.changeLog && request.changeLog.length > 0
                    ? normalizeChangeLogEntry(
                        request.changeLog[request.changeLog.length - 1],
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
                        <Stack
                          spacing={0.25}
                          sx={{ justifyContent: "flex-start" }}
                        >
                          {equipmentPreview.map((line, index) => (
                            <Typography
                              key={`active-card-equipment-${request.id}-${index}`}
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
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            aria-label={`Edit request work order ${request.id}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenWorkOrderDialog(request);
                            }}
                          >
                            <EditRounded color="primary" />
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
                      <RequestRow key={request.id} request={request} />
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

          <Box sx={{ mt: 2, textAlign: "right" }}>
            <Button component={Link} to="/completed" variant="text">
              View completed requests
            </Button>
          </Box>
        </Card>
      )}

      <Drawer anchor="bottom" open={detailsOpen} onClose={closeDetails}>
        <Box sx={{ p: 2, maxHeight: "80vh", overflowY: "auto" }}>
          {selectedRequest ? (
            <>
              <Box
                sx={{ display: "flex", justifyContent: "flex-end", mb: 0.5 }}
              >
                <IconButton
                  size="small"
                  aria-label="Close request details"
                  onClick={closeDetails}
                >
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
                Work Order:{" "}
                {toWorkOrderString(selectedRequest.workOrder) || "-"}
              </Typography>
              <Typography variant="body2">
                Status Time:{" "}
                {formatTimestampWithRelative(selectedRequest.statusTimestamp)}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {`Request ID: ${selectedRequest.id}`}
              </Typography>

              <Divider sx={{ my: 1.5 }} />

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Equipment
              </Typography>
              <Box sx={{ mb: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddRounded />}
                  onClick={handleOpenAddEquipmentDialog}
                >
                  Add Equipment
                </Button>
              </Box>
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
                    <Card
                      key={`${item.stock}-${index}`}
                      variant="outlined"
                      sx={{ p: 1.25 }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.model}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        {`Stock: ${item.stock} | Serial: ${item.serial}`}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ display: "block", mt: 0.25 }}
                      >
                        {`WO: ${item.workOrder || "-"}`}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ display: "block", mt: 0.5 }}
                      >
                        {`Work: ${item.work || "-"}`}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 0.25 }}
                      >
                        {`Notes: ${item.notes || "-"}`}
                      </Typography>
                      <Box sx={{ mt: 0.75 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpenEditEquipmentDialog(item)}
                        >
                          Edit Equipment
                        </Button>
                      </Box>
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
          <Timeline position="alternate">
            {visibleHistoryChangeLog.map((change, index) => (
              <TimelineItem key={`${change.timestamp}-${change.user}-${index}`}>
                <TimelineSeparator>
                  <TimelineDot variant="outlined" color="primary" />
                  {index + 1 !== visibleHistoryChangeLog.length ? (
                    <TimelineConnector />
                  ) : null}
                </TimelineSeparator>
                <TimelineContent>
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
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </Box>
      </Dialog>

      <Dialog
        onClose={handleCloseWorkOrderDialog}
        open={openWorkOrderDialog}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <Box
          sx={{
            p: 2.5,
            minHeight: { xs: "100dvh", sm: "unset" },
            display: "flex",
            flexDirection: "column",
            justifyContent: { xs: "center", sm: "flex-start" },
          }}
        >
          <Typography variant="h6" color="primary" sx={{ mb: 1.5 }}>
            Edit Work Order
          </Typography>
          <Stack
            spacing={1.25}
            sx={{
              maxHeight: isMobile ? "unset" : 340,
              overflowY: "auto",
              pr: 0.25,
            }}
          >
            {workOrderEquipment.map((item) => (
              <Box key={`card-wo-${item.stock}`}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 0.5 }}
                >
                  {`WO for: ${item.model} - ${item.stock}`}
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Work Order"
                  value={equipmentWorkOrders[item.stock] || ""}
                  onChange={(event) =>
                    setEquipmentWorkOrders((previous) => ({
                      ...previous,
                      [item.stock]: event.target.value,
                    }))
                  }
                />
              </Box>
            ))}
            {workOrderEquipment.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No equipment found for this request.
              </Typography>
            ) : null}
          </Stack>
          <Box sx={{ mt: 1.5, textAlign: "right" }}>
            <Button
              size="small"
              onClick={handleCloseWorkOrderDialog}
              sx={{ mr: 1 }}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={saveWorkOrderFromCard}
              disabled={workOrderEquipment.length === 0}
            >
              Save
            </Button>
          </Box>
        </Box>
      </Dialog>

      <Dialog
        onClose={handleCloseEditEquipmentDialog}
        open={openEditEquipmentDialog}
        fullWidth
        maxWidth="sm"
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" color="primary" sx={{ mb: 1.5 }}>
            Edit Equipment
          </Typography>
          {editingEquipment ? (
            <Stack spacing={1}>
              <TextField
                size="small"
                label="Model"
                value={editingEquipment.model}
                onChange={(event) =>
                  handleEditEquipmentField(
                    "model",
                    event.target.value.toUpperCase(),
                  )
                }
              />
              <TextField
                size="small"
                label="Stock"
                value={editingEquipment.stock}
                onChange={(event) =>
                  handleEditEquipmentField("stock", event.target.value)
                }
              />
              <TextField
                size="small"
                label="Serial"
                value={editingEquipment.serial}
                onChange={(event) =>
                  handleEditEquipmentField(
                    "serial",
                    event.target.value.toUpperCase(),
                  )
                }
              />
              <TextField
                size="small"
                label="Work Order"
                value={editingEquipment.workOrder || ""}
                onChange={(event) =>
                  handleEditEquipmentField("workOrder", event.target.value)
                }
              />
              <TextField
                size="small"
                label="Work"
                value={editingEquipment.work}
                onChange={(event) =>
                  handleEditEquipmentField("work", event.target.value)
                }
              />
              <TextField
                size="small"
                label="Notes"
                value={editingEquipment.notes}
                onChange={(event) =>
                  handleEditEquipmentField("notes", event.target.value)
                }
              />
              <Stack spacing={1}>
                <Typography variant="subtitle2">Part Numbers</Typography>
                {(editingEquipment.partNumbersList || [""]).map(
                  (partNumber, index) => (
                    <Stack
                      key={`requests-edit-eq-part-${index}`}
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                    >
                      <TextField
                        size="small"
                        label={`Part Number ${index + 1}`}
                        value={partNumber}
                        onChange={(event) =>
                          handleEditPartNumberRowChange(index, event.target.value)
                        }
                        fullWidth
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        color="inherit"
                        onClick={() => handleRemoveEditPartNumberRow(index)}
                        disabled={
                          (editingEquipment.partNumbersList || [""]).length === 1 &&
                          !partNumber
                        }
                      >
                        Remove
                      </Button>
                    </Stack>
                  ),
                )}
                <Box>
                  <Button
                    size="small"
                    variant="text"
                    onClick={handleAddEditPartNumberRow}
                  >
                    Add Part Number
                  </Button>
                </Box>
              </Stack>
            </Stack>
          ) : null}
          <Box sx={{ mt: 1.5, textAlign: "right" }}>
            <Button
              size="small"
              onClick={handleCloseEditEquipmentDialog}
              sx={{ mr: 1 }}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={saveEditedEquipment}
            >
              Save
            </Button>
          </Box>
        </Box>
      </Dialog>

      <Dialog
        onClose={handleCloseAddEquipmentDialog}
        open={openAddEquipmentDialog}
        fullWidth
        maxWidth="sm"
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" color="primary" sx={{ mb: 1.5 }}>
            Add Equipment
          </Typography>
          <Stack spacing={1}>
            <TextField
              size="small"
              label="Model"
              value={newEquipment.model}
              onChange={(event) =>
                handleNewEquipmentField(
                  "model",
                  event.target.value.toUpperCase(),
                )
              }
            />
            <TextField
              size="small"
              label="Stock"
              value={newEquipment.stock}
              onChange={(event) =>
                handleNewEquipmentField("stock", event.target.value)
              }
            />
            <TextField
              size="small"
              label="Serial"
              value={newEquipment.serial}
              onChange={(event) =>
                handleNewEquipmentField(
                  "serial",
                  event.target.value.toUpperCase(),
                )
              }
            />
            <TextField
              size="small"
              label="Work Order"
              value={newEquipment.workOrder}
              onChange={(event) =>
                handleNewEquipmentField("workOrder", event.target.value)
              }
            />
            <TextField
              size="small"
              label="Work"
              value={newEquipment.work}
              onChange={(event) =>
                handleNewEquipmentField("work", event.target.value)
              }
            />
            <TextField
              size="small"
              label="Notes"
              value={newEquipment.notes}
              onChange={(event) =>
                handleNewEquipmentField("notes", event.target.value)
              }
            />
            <Stack spacing={1}>
              <Typography variant="subtitle2">Part Numbers</Typography>
              {(newEquipment.partNumbersList || [""]).map((partNumber, index) => (
                <Stack
                  key={`requests-add-eq-part-${index}`}
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                >
                  <TextField
                    size="small"
                    label={`Part Number ${index + 1}`}
                    value={partNumber}
                    onChange={(event) =>
                      handlePartNumberRowChange(index, event.target.value)
                    }
                    fullWidth
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    onClick={() => handleRemovePartNumberRow(index)}
                    disabled={
                      (newEquipment.partNumbersList || [""]).length === 1 &&
                      !partNumber
                    }
                  >
                    Remove
                  </Button>
                </Stack>
              ))}
              <Box>
                <Button size="small" variant="text" onClick={handleAddPartNumberRow}>
                  Add Part Number
                </Button>
              </Box>
            </Stack>
          </Stack>
          <Box sx={{ mt: 1.5, textAlign: "right" }}>
            <Button
              size="small"
              onClick={handleCloseAddEquipmentDialog}
              sx={{ mr: 1 }}
            >
              Cancel
            </Button>
            <Button size="small" variant="contained" onClick={saveNewEquipment}>
              Add
            </Button>
          </Box>
        </Box>
      </Dialog>

      <Dialog
        open={openNoPartsDialog}
        onClose={() => closeNoPartsDialog(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Confirm No Parts Required</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This equipment has no part numbers attached. Please confirm that no
            parts are required for this equipment or add the required parts now.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => closeNoPartsDialog(false)}>Add Parts</Button>
          <Button variant="contained" onClick={() => closeNoPartsDialog(true)}>
            No Parts Required
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
