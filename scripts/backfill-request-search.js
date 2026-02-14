#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const CHECKPOINT_PATH = path.resolve(
  __dirname,
  ".backfill-request-search-checkpoint.json"
);

const args = new Set(process.argv.slice(2));
const isDryRun = args.has("--dry-run");
const shouldResetCheckpoint = args.has("--reset-checkpoint");

const MAX_READS = Number(process.env.MAX_READS || 40000);
const PAGE_SIZE = Number(process.env.PAGE_SIZE || 100);
const INDEX_COLLECTION = process.env.INDEX_COLLECTION || "reuqest_search";
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;

const parseTimestampToSortable = (timestamp) => {
  if (!timestamp || typeof timestamp !== "string") {
    return 0;
  }

  const parsed = Date.parse(timestamp);
  if (!Number.isNaN(parsed)) {
    return parsed;
  }

  return 0;
};

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const loadCheckpoint = () => {
  if (shouldResetCheckpoint || !fs.existsSync(CHECKPOINT_PATH)) {
    return {
      branchCursor: null,
      requestCursorByBranch: {},
      reads: 0,
      writes: 0,
      processedRequests: 0,
      updatedAt: null,
    };
  }

  try {
    return JSON.parse(fs.readFileSync(CHECKPOINT_PATH, "utf8"));
  } catch (error) {
    console.warn("Checkpoint read failed, starting fresh.");
    return {
      branchCursor: null,
      requestCursorByBranch: {},
      reads: 0,
      writes: 0,
      processedRequests: 0,
      updatedAt: null,
    };
  }
};

const saveCheckpoint = (checkpoint) => {
  const payload = {
    ...checkpoint,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify(payload, null, 2));
};

const initFirestore = () => {
  if (!admin.apps.length) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: PROJECT_ID,
      });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: PROJECT_ID || serviceAccount.project_id,
      });
    } else {
      throw new Error(
        "Missing credentials. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON."
      );
    }
  }

  return admin.firestore();
};

const buildSearchProjection = (branchId, requestData, equipmentRows) => {
  const requestId = String(requestData.id || "");
  const equipmentText = equipmentRows
    .map((row) =>
      [
        row.model,
        row.stock,
        row.serial,
        row.workOrder,
        row.work,
        row.notes,
      ]
        .filter(Boolean)
        .join(" ")
    )
    .join(" ");

  const searchableText = normalizeText(
    [
      requestId,
      requestData.salesman,
      requestData.workOrder,
      requestData.status,
      branchId,
      equipmentText,
    ]
      .filter(Boolean)
      .join(" ")
  );

  return {
    requestId,
    branch: branchId,
    status: requestData.status || "",
    timestamp: requestData.timestamp || "",
    salesman: requestData.salesman || "",
    workOrder: requestData.workOrder || "",
    equipmentText,
    searchableText,
    updatedAt: parseTimestampToSortable(requestData.timestamp),
  };
};

const main = async () => {
  console.log(
    `Starting backfill (collection=${INDEX_COLLECTION}, maxReads=${MAX_READS}, dryRun=${isDryRun})`
  );

  const db = initFirestore();
  const checkpoint = loadCheckpoint();
  let readCount = 0;
  let writeCount = 0;
  let processedRequests = 0;
  let stopReason = "";

  const branchesSnap = await db.collection("branches").get();
  readCount += branchesSnap.size;
  const branchDocs = branchesSnap.docs.sort((a, b) => a.id.localeCompare(b.id));

  let startBranchIndex = 0;
  if (checkpoint.branchCursor) {
    const cursorIndex = branchDocs.findIndex((doc) => doc.id === checkpoint.branchCursor);
    if (cursorIndex >= 0) {
      startBranchIndex = cursorIndex;
    }
  }

  for (let b = startBranchIndex; b < branchDocs.length; b += 1) {
    const branchDoc = branchDocs[b];
    const branchId = branchDoc.id;

    if (readCount >= MAX_READS) {
      stopReason = `Reached read budget before branch ${branchId}.`;
      checkpoint.branchCursor = branchId;
      break;
    }

    let lastRequestId = checkpoint.requestCursorByBranch?.[branchId] || null;
    let keepPaging = true;

    while (keepPaging) {
      if (readCount >= MAX_READS) {
        stopReason = `Reached read budget while paging branch ${branchId}.`;
        checkpoint.branchCursor = branchId;
        keepPaging = false;
        break;
      }

      let requestsQuery = db
        .collection("branches")
        .doc(branchId)
        .collection("requests")
        .where("status", "==", "Completed")
        .orderBy("id")
        .limit(PAGE_SIZE);

      if (lastRequestId) {
        requestsQuery = requestsQuery.startAfter(lastRequestId);
      }

      const requestsSnap = await requestsQuery.get();
      readCount += requestsSnap.size;

      if (requestsSnap.empty) {
        delete checkpoint.requestCursorByBranch[branchId];
        keepPaging = false;
        break;
      }

      let batch = db.batch();
      let batchWrites = 0;

      for (const requestDoc of requestsSnap.docs) {
        if (readCount >= MAX_READS) {
          stopReason = `Reached read budget while processing requests in ${branchId}.`;
          checkpoint.branchCursor = branchId;
          keepPaging = false;
          break;
        }

        const requestData = requestDoc.data();
        const requestId = String(requestData.id || requestDoc.id);

        const equipmentSnap = await requestDoc.ref.collection("equipment").get();
        readCount += equipmentSnap.size;

        const equipmentRows = equipmentSnap.docs.map((doc) => doc.data());
        const projection = buildSearchProjection(branchId, requestData, equipmentRows);
        const targetRef = db.collection(INDEX_COLLECTION).doc(requestId);

        if (!isDryRun) {
          batch.set(targetRef, projection, { merge: true });
          batchWrites += 1;
        }

        processedRequests += 1;
        lastRequestId = requestId;
        checkpoint.requestCursorByBranch[branchId] = requestId;

        if (!isDryRun && batchWrites >= 200) {
          await batch.commit();
          writeCount += batchWrites;
          batch = db.batch();
          batchWrites = 0;
        }

        if (processedRequests % 100 === 0) {
          console.log(
            `Processed=${processedRequests} reads=${readCount} writes=${writeCount} branch=${branchId}`
          );
          checkpoint.branchCursor = branchId;
          saveCheckpoint(checkpoint);
        }
      }

      if (!isDryRun && batchWrites > 0) {
        await batch.commit();
        writeCount += batchWrites;
      }

      if (requestsSnap.size < PAGE_SIZE) {
        delete checkpoint.requestCursorByBranch[branchId];
        keepPaging = false;
      }
    }

    if (stopReason) {
      break;
    }

    checkpoint.branchCursor = branchId;
  }

  if (!stopReason) {
    checkpoint.branchCursor = null;
  }

  checkpoint.reads = Number(checkpoint.reads || 0) + readCount;
  checkpoint.writes = Number(checkpoint.writes || 0) + writeCount;
  checkpoint.processedRequests =
    Number(checkpoint.processedRequests || 0) + processedRequests;
  saveCheckpoint(checkpoint);

  console.log("Backfill complete.");
  console.log(
    JSON.stringify(
      {
        runReads: readCount,
        runWrites: writeCount,
        runProcessedRequests: processedRequests,
        stoppedEarly: Boolean(stopReason),
        stopReason: stopReason || null,
        checkpointPath: CHECKPOINT_PATH,
        dryRun: isDryRun,
      },
      null,
      2
    )
  );
};

main().catch((error) => {
  console.error("Backfill failed:", error.message);
  process.exitCode = 1;
});
