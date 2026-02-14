import { useCallback, useEffect, useState } from "react";

const SALESMEN_API_URL = "https://psides83.github.io/listJSON/salesmanList.json";

export default function useSalesmen() {
  const [salesmen, setSalesmen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const fetchSalesmen = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await fetch(SALESMEN_API_URL);
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const json = await response.json();
      setSalesmen(Array.isArray(json) ? json : []);
    } catch (error) {
      setSalesmen([]);
      setLoadError("Unable to load salesmen list right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalesmen();
  }, [fetchSalesmen]);

  return {
    salesmen,
    loading,
    loadError,
    refetchSalesmen: fetchSalesmen,
  };
}
