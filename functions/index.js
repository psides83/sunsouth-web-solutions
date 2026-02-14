const admin = require("firebase-admin");
const {onDocumentWritten} = require("firebase-functions/v2/firestore");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");

admin.initializeApp();

const db = admin.firestore();
const SEARCH_COLLECTION = "reuqest_search";
const RECONCILE_PAGE_SIZE = 200;
const RECONCILE_MAX_REQUESTS = 3000;

const toFlatText = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map(toFlatText).filter(Boolean).join(" / ");
  }

  if (typeof value === "object") {
    return Object.values(value).map(toFlatText).filter(Boolean).join(" ");
  }

  return String(value);
};

const normalizeText = (value) =>
  toFlatText(value)
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

const toEquipmentText = (equipmentRows) =>
  equipmentRows
      .map((row) =>
        [
          row.model,
          row.stock,
          row.serial,
          row.workOrder,
          row.work,
          row.notes,
        ].map(toFlatText).filter(Boolean).join(" "),
      )
      .join(" ");

const deleteSearchDoc = async (requestId) => {
  await db.collection(SEARCH_COLLECTION).doc(String(requestId)).delete();
};

const rebuildSearchDoc = async (branchId, requestId) => {
  const requestRef = db
      .collection("branches")
      .doc(branchId)
      .collection("requests")
      .doc(requestId);

  const requestSnapshot = await requestRef.get();
  if (!requestSnapshot.exists) {
    await deleteSearchDoc(requestId);
    return;
  }

  const requestData = requestSnapshot.data() || {};
  const canonicalRequestId = String(requestData.id || requestId);
  const status = toFlatText(requestData.status);

  if (status !== "Completed") {
    await Promise.all([
      deleteSearchDoc(requestId),
      canonicalRequestId !== String(requestId) ?
        deleteSearchDoc(canonicalRequestId) :
        Promise.resolve(),
    ]);
    return;
  }

  const equipmentSnapshot = await requestRef.collection("equipment").get();
  const equipmentRows = equipmentSnapshot.docs.map((doc) => doc.data() || {});
  const equipmentText = toEquipmentText(equipmentRows);
  const workOrder = toFlatText(requestData.workOrder);

  const payload = {
    requestId: canonicalRequestId,
    branch: String(branchId),
    status: "Completed",
    timestamp: toFlatText(requestData.timestamp),
    salesman: toFlatText(requestData.salesman),
    workOrder,
    equipmentText,
    searchableText: normalizeText([
      canonicalRequestId,
      branchId,
      status,
      requestData.salesman,
      requestData.timestamp,
      workOrder,
      equipmentText,
    ]),
    updatedAt: Date.now(),
  };

  await db.collection(SEARCH_COLLECTION).doc(canonicalRequestId).set(payload, {
    merge: true,
  });
};

exports.syncRequestSearchOnRequestWrite = onDocumentWritten(
    "branches/{branchId}/requests/{requestId}",
    async (event) => {
      const branchId = event.params.branchId;
      const requestId = event.params.requestId;

      try {
        if (!event.data || !event.data.after.exists) {
          await deleteSearchDoc(requestId);
          return;
        }

        await rebuildSearchDoc(branchId, requestId);
      } catch (error) {
        logger.error("Request search sync failed on request write.", {
          branchId,
          requestId,
          error: error.message,
        });
        throw error;
      }
    },
);

exports.syncRequestSearchOnEquipmentWrite = onDocumentWritten(
    "branches/{branchId}/requests/{requestId}/equipment/{equipmentId}",
    async (event) => {
      const branchId = event.params.branchId;
      const requestId = event.params.requestId;

      try {
        await rebuildSearchDoc(branchId, requestId);
      } catch (error) {
        logger.error("Request search sync failed on equipment write.", {
          branchId,
          requestId,
          equipmentId: event.params.equipmentId,
          error: error.message,
        });
        throw error;
      }
    },
);

exports.reconcileRequestSearchIndex = onSchedule(
    {
      schedule: "every 24 hours",
      timeZone: "America/Chicago",
      region: "us-central1",
      retryCount: 0,
    },
    async () => {
      logger.info("Starting scheduled request search reconcile.");

      const branchesSnapshot = await db.collection("branches").get();
      let processedRequests = 0;
      let reconciledRequests = 0;
      let branchCount = 0;

      for (const branchDoc of branchesSnapshot.docs) {
        if (processedRequests >= RECONCILE_MAX_REQUESTS) {
          break;
        }

        const branchId = branchDoc.id;
        branchCount += 1;
        let lastRequestSnapshot = null;
        let keepPaging = true;

        while (keepPaging && processedRequests < RECONCILE_MAX_REQUESTS) {
          let requestsQuery = db
              .collection("branches")
              .doc(branchId)
              .collection("requests")
              .where("status", "==", "Completed")
              .orderBy("id")
              .limit(RECONCILE_PAGE_SIZE);

          if (lastRequestSnapshot) {
            requestsQuery = requestsQuery.startAfter(lastRequestSnapshot);
          }

          const requestsSnapshot = await requestsQuery.get();
          if (requestsSnapshot.empty) {
            keepPaging = false;
            break;
          }

          for (const requestDoc of requestsSnapshot.docs) {
            if (processedRequests >= RECONCILE_MAX_REQUESTS) {
              keepPaging = false;
              break;
            }

            processedRequests += 1;
            await rebuildSearchDoc(branchId, requestDoc.id);
            reconciledRequests += 1;
          }

          lastRequestSnapshot =
            requestsSnapshot.docs[requestsSnapshot.docs.length - 1];
          if (requestsSnapshot.size < RECONCILE_PAGE_SIZE) {
            keepPaging = false;
          }
        }
      }

      logger.info("Scheduled request search reconcile complete.", {
        branchCount,
        processedRequests,
        reconciledRequests,
        hitSafetyCap: processedRequests >= RECONCILE_MAX_REQUESTS,
      });
    },
);
