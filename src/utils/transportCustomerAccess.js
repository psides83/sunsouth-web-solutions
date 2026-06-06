const createTransportAccessToken = () => {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const buffer = new Uint32Array(4);
    window.crypto.getRandomValues(buffer);
    return Array.from(buffer)
      .map((value) => value.toString(36))
      .join("");
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
};

const buildTransportCustomerAccessLink = ({ origin, branch, requestId, token }) => {
  if (!origin || !branch || !requestId || !token) {
    return "";
  }

  return `${origin}/transport-view/${encodeURIComponent(branch)}/${encodeURIComponent(
    requestId,
  )}/${encodeURIComponent(token)}`;
};

export { createTransportAccessToken, buildTransportCustomerAccessLink };
