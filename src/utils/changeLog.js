import moment from "moment";

export const CHANGE_ACTION_FILTER_ALL = "all";

export const CHANGE_ACTIONS = {
  REQUEST_CREATED: "request_created",
  STATUS_UPDATED: "status_updated",
  WORK_ORDER_UPDATED: "work_order_updated",
  EQUIPMENT_ADDED: "equipment_added",
  EQUIPMENT_UPDATED: "equipment_updated",
  EQUIPMENT_DELETED: "equipment_deleted",
  REQUEST_DELETED: "request_deleted",
  OTHER: "other",
};

export const CHANGE_ACTION_LABELS = {
  [CHANGE_ACTIONS.REQUEST_CREATED]: "Request Created",
  [CHANGE_ACTIONS.STATUS_UPDATED]: "Status Updated",
  [CHANGE_ACTIONS.WORK_ORDER_UPDATED]: "Work Order Updated",
  [CHANGE_ACTIONS.EQUIPMENT_ADDED]: "Equipment Added",
  [CHANGE_ACTIONS.EQUIPMENT_UPDATED]: "Equipment Updated",
  [CHANGE_ACTIONS.EQUIPMENT_DELETED]: "Equipment Deleted",
  [CHANGE_ACTIONS.REQUEST_DELETED]: "Request Deleted",
  [CHANGE_ACTIONS.OTHER]: "Other",
};

const inferActionType = (changeValue) => {
  const normalized = Array.isArray(changeValue)
    ? changeValue.join(" ").toLowerCase()
    : String(changeValue || "").toLowerCase();

  if (normalized.includes("request created")) return CHANGE_ACTIONS.REQUEST_CREATED;
  if (normalized.includes("status updated")) return CHANGE_ACTIONS.STATUS_UPDATED;
  if (normalized.includes("work order")) return CHANGE_ACTIONS.WORK_ORDER_UPDATED;
  if (normalized.includes("equipment added")) return CHANGE_ACTIONS.EQUIPMENT_ADDED;
  if (normalized.includes("equipment model updated")) return CHANGE_ACTIONS.EQUIPMENT_UPDATED;
  if (normalized.includes("equipment stock number updated")) return CHANGE_ACTIONS.EQUIPMENT_UPDATED;
  if (normalized.includes("equipment serial number updated")) return CHANGE_ACTIONS.EQUIPMENT_UPDATED;
  if (normalized.includes("equipment work required updated")) return CHANGE_ACTIONS.EQUIPMENT_UPDATED;
  if (normalized.includes("equipment notes")) return CHANGE_ACTIONS.EQUIPMENT_UPDATED;
  if (normalized.includes("deleted from the request")) return CHANGE_ACTIONS.EQUIPMENT_DELETED;
  if (normalized.includes("request deleted")) return CHANGE_ACTIONS.REQUEST_DELETED;

  return CHANGE_ACTIONS.OTHER;
};

const normalizeDetails = (entry) => {
  if (Array.isArray(entry?.details)) {
    return entry.details;
  }

  if (Array.isArray(entry?.change)) {
    return entry.change;
  }

  return [];
};

const normalizeSummary = (entry, details) => {
  if (entry?.summary && typeof entry.summary === "string") {
    return entry.summary;
  }

  if (typeof entry?.change === "string" && entry.change.trim() !== "") {
    return entry.change;
  }

  if (details.length > 0) {
    return details.join(", ");
  }

  return "Change recorded";
};

export const normalizeChangeLogEntry = (entry) => {
  const details = normalizeDetails(entry);
  const actionType = entry?.actionType || inferActionType(entry?.change);
  const summary = normalizeSummary(entry, details);

  return {
    user: entry?.user || "Unknown",
    timestamp:
      entry?.timestamp || moment().format("DD-MMM-yyyy hh:mmA"),
    actionType,
    summary,
    details,
  };
};

export const createChangeLogEntry = ({
  user,
  actionType,
  summary,
  details = [],
  timestamp = moment().format("DD-MMM-yyyy hh:mmA"),
}) => ({
  user,
  timestamp,
  actionType,
  summary,
  details,
  // Keep legacy field for backward compatibility with older renderers.
  change: details.length > 0 ? details : summary,
});

export const getChangeLogActionOptions = (normalizedEntries) => {
  const uniqueActionTypes = Array.from(
    new Set((normalizedEntries || []).map((entry) => entry.actionType))
  );

  return [
    { value: CHANGE_ACTION_FILTER_ALL, label: "All Actions" },
    ...uniqueActionTypes.map((actionType) => ({
      value: actionType,
      label: CHANGE_ACTION_LABELS[actionType] || CHANGE_ACTION_LABELS[CHANGE_ACTIONS.OTHER],
    })),
  ];
};
