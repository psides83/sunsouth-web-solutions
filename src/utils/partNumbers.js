export const parsePartNumbersInput = (value) => {
  if (!value) {
    return [];
  }

  const tokens = String(value)
    .split(/[\n,]+/)
    .map((token) => token.trim().toUpperCase())
    .filter(Boolean);

  return Array.from(new Set(tokens));
};

export const normalizePartNumbers = (value) => {
  if (Array.isArray(value)) {
    const tokens = value
      .map((token) => String(token || "").trim().toUpperCase())
      .filter(Boolean);
    return Array.from(new Set(tokens));
  }

  return parsePartNumbersInput(value);
};

export const toPartNumberSummary = (partNumbers) => {
  if (!Array.isArray(partNumbers) || partNumbers.length === 0) {
    return "";
  }

  return partNumbers.join(", ");
};

export const toPartNumberDocId = (partNumber) => {
  return encodeURIComponent(String(partNumber || "").trim().toUpperCase());
};
