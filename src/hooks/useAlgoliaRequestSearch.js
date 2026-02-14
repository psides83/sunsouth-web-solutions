import { useEffect, useMemo, useState } from "react";

const ALGOLIA_APP_ID = process.env.REACT_APP_ALGOLIA_APP_ID || "";
const ALGOLIA_SEARCH_KEY = process.env.REACT_APP_ALGOLIA_SEARCH_KEY || "";
const ALGOLIA_INDEX_NAME =
  process.env.REACT_APP_ALGOLIA_INDEX_NAME || "reuqest_search";

const escapeFilterValue = (value) => String(value || "").replace(/"/g, '\\"');

const getHitRequestId = (hit) =>
  hit?.requestId || hit?.requestID || hit?.id || hit?.objectID || "";

export default function useAlgoliaRequestSearch({
  queryText,
  branch,
  status,
  minChars = 2,
  useFilters = false,
}) {
  const [matchedRequestIds, setMatchedRequestIds] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const canSearch = useMemo(
    () => ALGOLIA_APP_ID !== "" && ALGOLIA_SEARCH_KEY !== "",
    []
  );

  useEffect(() => {
    const normalizedQuery = (queryText || "").trim();

    if (normalizedQuery.length < minChars) {
      setMatchedRequestIds([]);
      setSearchError("");
      setIsSearching(false);
      return;
    }

    if (!canSearch) {
      setMatchedRequestIds([]);
      setSearchError("Algolia search is not configured.");
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError("");

      try {
        const isNumericQuery = /^\d+$/.test(normalizedQuery);
        const filters = [];
        if (useFilters && branch) {
          filters.push(`branch:"${escapeFilterValue(branch)}"`);
        }
        if (useFilters && status) {
          filters.push(`status:"${escapeFilterValue(status)}"`);
        }

        const response = await fetch(
          `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${encodeURIComponent(
            ALGOLIA_INDEX_NAME
          )}/query`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Algolia-API-Key": ALGOLIA_SEARCH_KEY,
              "X-Algolia-Application-Id": ALGOLIA_APP_ID,
            },
            body: JSON.stringify({
              query: normalizedQuery,
              hitsPerPage: 500,
              attributesToRetrieve: ["requestId", "requestID", "id", "objectID"],
              filters: filters.length > 0 ? filters.join(" AND ") : undefined,
              ...(isNumericQuery
                ? {
                    typoTolerance: false,
                    removeWordsIfNoResults: "none",
                  }
                : {}),
            }),
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          const errorPayload = await response
            .json()
            .catch(() => ({ message: "Unknown Algolia error" }));
          throw new Error(
            `Algolia request failed with status ${response.status}: ${
              errorPayload?.message || "Unknown Algolia error"
            }`
          );
        }

        const payload = await response.json();
        const ids = (payload?.hits || [])
          .map(getHitRequestId)
          .filter(Boolean)
          .map((id) => String(id));

        setMatchedRequestIds(ids);
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        console.error("Algolia search error:", error);
        setMatchedRequestIds([]);
        const reason =
          error?.message && String(error.message).trim() !== ""
            ? error.message
            : "Unknown search error";
        setSearchError(
          `Indexed search failed (${reason}). Showing local results only.`
        );
      } finally {
        setIsSearching(false);
      }
    }, 700);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [branch, canSearch, minChars, queryText, status, useFilters]);

  return {
    matchedRequestIds,
    isSearching,
    searchError,
  };
}
