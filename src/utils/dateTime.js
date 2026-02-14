import moment from "moment";

const KNOWN_TIMESTAMP_FORMATS = [
  "DD-MMM-yyyy hh:mmA",
  "DD-MMM-yyyy h:mmA",
  "DD-MMM-yyyy",
  "YYYY-MM-DD",
  "M/D/YYYY",
  "MM/DD/YYYY",
];

const parseTimestamp = (timestamp) => {
  const strictKnownFormat = moment(timestamp, KNOWN_TIMESTAMP_FORMATS, true);
  if (strictKnownFormat.isValid()) {
    return strictKnownFormat;
  }

  const inferredFormat = moment(timestamp);
  if (inferredFormat.isValid()) {
    return inferredFormat;
  }

  return null;
};

export const formatTimestampWithRelative = (timestamp) => {
  if (!timestamp) {
    return "";
  }

  const parsed = parseTimestamp(timestamp);
  if (!parsed) {
    return timestamp;
  }

  return `${timestamp} (${parsed.fromNow()})`;
};

export const formatRelativeTimestamp = (timestamp) => {
  if (!timestamp) {
    return "";
  }

  const parsed = parseTimestamp(timestamp);
  if (!parsed) {
    return "";
  }

  return parsed.fromNow();
};
