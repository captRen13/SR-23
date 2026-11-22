// Star Runner Data Store
// Version: 1.0.0
// Local-first IndexedDB foundation for Star Runner 2.1.

(function (root) {
  "use strict";

  const DB_NAME = "star-runner-data";
  const DB_VERSION = 1;
  const LEGACY_MISSION_KEY = "star-runner-missions-v1";
  const MIGRATION_KEY = "migration:localStorage-missions-v1";

  const STORES = {
    vessels: "vessels",
    crew: "crew",
    missions: "missions",
    calendar: "calendar",
    system: "system"
  };

  function requestResult(request) {
    return new Promise(function (resolve, reject) {
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () {
        reject(request.error || new Error("IndexedDB request failed."));
      };
    });
  }

  function transactionDone(transaction) {
    return new Promise(function (resolve, reject) {
      transaction.oncomplete = function () { resolve(); };
      transaction.onerror = function () {
        reject(transaction.error || new Error("IndexedDB transaction failed."));
      };
      transaction.onabort = function () {
        reject(transaction.error || new Error("IndexedDB transaction aborted."));
      };
    });
  }

  function open() {
    return new Promise(function (resolve, reject) {
      if (!root.indexedDB) {
        reject(new Error("IndexedDB is not available in this browser."));
        return;
      }

      const request = root.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = function (event) {
        const db = event.target.result;
        Object.keys(STORES).forEach(function (name) {
          const storeName = STORES[name];
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: "id" });
          }
        });
      };

      request.onsuccess = function () {
        const db = request.result;
        db.onversionchange = function () { db.close(); };
        resolve(db);
      };

      request.onerror = function () {
        reject(request.error || new Error("Unable to open Star Runner database."));
      };

      request.onblocked = function () {
        reject(new Error("Database upgrade is blocked by another open Star Runner tab."));
      };
    });
  }

  function validateMission(record) {
    return !!record &&
      typeof record.id === "string" &&
      record.id.length > 0 &&
      typeof record.title === "string" &&
      record.title.length > 0;
  }

  async function migrateLegacyMissions(db) {
    let raw;
    try { raw = root.localStorage.getItem(LEGACY_MISSION_KEY); }
    catch (error) { throw new Error("Unable to read existing mission records: " + error.message); }
    if (raw === null) return { migrated: false, count: 0, reason: "no-legacy-records" };

    let records;
    try { records = JSON.parse(raw); }
    catch (_) { throw new Error("Existing mission data is not valid JSON. Original data was left untouched."); }
    if (!Array.isArray(records) || !records.every(validateMission)) {
      throw new Error("Existing mission data did not pass validation. Original data was left untouched.");
    }

    const transaction = db.transaction([STORES.missions, STORES.system], "readwrite");
    const done = transactionDone(transaction);
    const missions = transaction.objectStore(STORES.missions);
    const system = transaction.objectStore(STORES.system);
    let existingMarker = null;
    const markerRequest = system.get(MIGRATION_KEY);

    // Queue writes inside the request callback; Safari may auto-close a
    // transaction if execution yields between IndexedDB requests.
    markerRequest.onsuccess = function () {
      existingMarker = markerRequest.result || null;
      if (existingMarker) return;
      records.forEach(function (record) { missions.put(record); });
      system.put({
        id: MIGRATION_KEY,
        completedAt: new Date().toISOString(),
        count: records.length,
        source: LEGACY_MISSION_KEY,
        sourceRetained: true
      });
    };

    await done;
    if (existingMarker) {
      return { migrated: false, count: existingMarker.count || 0, reason: "already-migrated" };
    }
    // Retain the original localStorage key as a recovery backup.
    return { migrated: true, count: records.length, reason: "completed" };
  }

  async function getAll(storeName) {
    if (!Object.values(STORES).includes(storeName)) {
      throw new Error("Unknown Star Runner data store: " + storeName);
    }
    const db = await open();
    try {
      const transaction = db.transaction([storeName], "readonly");
      const done = transactionDone(transaction);
      const records = await requestResult(transaction.objectStore(storeName).getAll());
      await done;
      return records;
    } finally {
      db.close();
    }
  }

  async function put(storeName, record) {
    if (!Object.values(STORES).includes(storeName)) {
      throw new Error("Unknown Star Runner data store: " + storeName);
    }
    if (!record || typeof record.id !== "string" || !record.id) {
      throw new TypeError("Every Star Runner record must have a non-empty string id.");
    }
    const db = await open();
    try {
      const transaction = db.transaction([storeName], "readwrite");
      const done = transactionDone(transaction);
      transaction.objectStore(storeName).put(record);
      await done;
      return record;
    } finally {
      db.close();
    }
  }

  async function putMany(storeName, records) {
    if (!Object.values(STORES).includes(storeName)) {
      throw new Error("Unknown Star Runner data store: " + storeName);
    }
    if (!Array.isArray(records)) {
      throw new TypeError("Records must be supplied as an array.");
    }
    const ids = new Set();
    records.forEach(function (record) {
      if (!record || typeof record.id !== "string" || !record.id) {
        throw new TypeError("Every Star Runner record must have a non-empty string id.");
      }
      if (ids.has(record.id)) {
        throw new Error("Duplicate record ID in batch: " + record.id);
      }
      ids.add(record.id);
    });
    if (records.length === 0) return [];
    const db = await open();
    try {
      const transaction = db.transaction([storeName], "readwrite");
      const done = transactionDone(transaction);
      const store = transaction.objectStore(storeName);
      records.forEach(function (record) { store.put(record); });
      await done;
      return records;
    } finally {
      db.close();
    }
  }

  async function remove(storeName, id) {
    if (!Object.values(STORES).includes(storeName)) {
      throw new Error("Unknown Star Runner data store: " + storeName);
    }
    const db = await open();
    try {
      const transaction = db.transaction([storeName], "readwrite");
      const done = transactionDone(transaction);
      transaction.objectStore(storeName).delete(id);
      await done;
    } finally {
      db.close();
    }
  }

  const MISSION_HISTORY_PREFIX = "mission-history::";
  const MAX_MISSION_REVISIONS = 50;

  function cloneRecord(record) {
    return record === null || record === undefined ? null : JSON.parse(JSON.stringify(record));
  }

  function changedMissionFields(before, after) {
    const keys = new Set(Object.keys(before || {}).concat(Object.keys(after || {})));
    return Array.from(keys).filter(function (key) {
      return JSON.stringify((before || {})[key]) !== JSON.stringify((after || {})[key]);
    }).sort();
  }

  function inferMissionActor(record, options) {
    if (options && options.actor) return options.actor;
    if (record && record.source === "apple-calendar") return "apple-calendar";
    if (record && record.statusOrigin === "schedule") return "scheduler";
    return "user";
  }

  async function writeMissionRecords(records, options, deleting) {
    if (!Array.isArray(records) || !records.length) return [];
    const ids = new Set();
    records.forEach(function (record) {
      if (!record || typeof record.id !== "string" || !record.id) {
        throw new TypeError("Every mission must have a non-empty string id.");
      }
      if (ids.has(record.id)) throw new Error("Duplicate mission ID in revision batch: " + record.id);
      ids.add(record.id);
    });

    const db = await open();
    try {
      const transaction = db.transaction([STORES.missions, STORES.system], "readwrite");
      const done = transactionDone(transaction);
      const missions = transaction.objectStore(STORES.missions);
      const system = transaction.objectStore(STORES.system);
      let conflict = null;

      records.forEach(function (record, index) {
        const historyId = MISSION_HISTORY_PREFIX + record.id;
        const oldRequest = missions.get(record.id);
        const historyRequest = system.get(historyId);
        const state = { oldReady: false, historyReady: false, oldRecord: null, historyRecord: null, written: false };

        function finishRecord() {
          if (!state.oldReady || !state.historyReady || state.written) return;
          state.written = true;
          const before = cloneRecord(state.oldRecord);
          const expectedRecords = options && options.expectedRecords;
          if (expectedRecords && Object.prototype.hasOwnProperty.call(expectedRecords, record.id)) {
            const expected = expectedRecords[record.id];
            const conflictFields = changedMissionFields(expected, before);
            if (conflictFields.length) {
              conflict = { id: record.id, fields: conflictFields };
              transaction.abort();
              return;
            }
          }
          const after = deleting ? null : cloneRecord(record);
          const changedFields = changedMissionFields(before, after);
          if (changedFields.length) {
            const revisions = state.historyRecord && Array.isArray(state.historyRecord.revisions)
              ? state.historyRecord.revisions.slice() : [];
            revisions.push({
              revisionId: String(Date.now()) + "-" + index + "-" + Math.random().toString(16).slice(2),
              changedAt: new Date().toISOString(),
              actor: inferMissionActor(record, options),
              action: deleting ? "deleted" : before ? "updated" : "created",
              changedFields: changedFields,
              before: before,
              after: after
            });
            system.put({
              id: historyId,
              missionId: record.id,
              revisions: revisions.slice(-MAX_MISSION_REVISIONS),
              updatedAt: new Date().toISOString()
            });
          }
          if (deleting) missions.delete(record.id);
          else missions.put(record);
        }

        oldRequest.onsuccess = function () {
          state.oldRecord = oldRequest.result || null;
          state.oldReady = true;
          finishRecord();
        };
        historyRequest.onsuccess = function () {
          state.historyRecord = historyRequest.result || null;
          state.historyReady = true;
          finishRecord();
        };
      });

      try {
        await done;
      } catch (error) {
        if (conflict) {
          throw new Error("MISSION CONFLICT: " + conflict.id + " changed after it was loaded. Conflicting fields: " + conflict.fields.join(", ") + ". Reload the mission and review the latest values before retrying.");
        }
        throw error;
      }
      return records;
    } finally {
      db.close();
    }
  }

  async function putMission(record, options) {
    await writeMissionRecords([record], options || {}, false);
    return record;
  }

  async function putMissions(records, options) {
    return writeMissionRecords(records, options || {}, false);
  }

  async function putMissionIfUnchanged(record, expectedRecord, options) {
    const settings = Object.assign({}, options || {});
    settings.expectedRecords = {};
    settings.expectedRecords[record.id] = cloneRecord(expectedRecord);
    await writeMissionRecords([record], settings, false);
    return record;
  }

  async function removeMissionIfUnchanged(id, expectedRecord, options) {
    if (typeof id !== "string" || !id) throw new TypeError("A mission ID is required.");
    if (!expectedRecord || expectedRecord.id !== id) throw new TypeError("A matching mission snapshot is required.");
    const settings = Object.assign({}, options || {});
    settings.expectedRecords = {};
    settings.expectedRecords[id] = cloneRecord(expectedRecord);
    await writeMissionRecords([expectedRecord], settings, true);
    return true;
  }

  async function removeMission(id, options) {
    if (typeof id !== "string" || !id) throw new TypeError("A mission ID is required.");
    const existing = await getAll(STORES.missions);
    const mission = existing.find(function (record) { return record.id === id; });
    if (!mission) return false;
    await writeMissionRecords([mission], options || { actor: "user" }, true);
    return true;
  }

  async function getMissionHistory(id) {
    if (typeof id !== "string" || !id) throw new TypeError("A mission ID is required.");
    const db = await open();
    try {
      const transaction = db.transaction([STORES.system], "readonly");
      const done = transactionDone(transaction);
      const record = await requestResult(transaction.objectStore(STORES.system).get(MISSION_HISTORY_PREFIX + id));
      await done;
      return record && Array.isArray(record.revisions) ? record.revisions.slice().reverse() : [];
    } finally {
      db.close();
    }
  }

  async function createBackup() {
    const db = await open();
    try {
      const storeNames = Object.keys(STORES).map(function (name) { return STORES[name]; });
      const transaction = db.transaction(storeNames, "readonly");
      const done = transactionDone(transaction);
      const reads = storeNames.map(function (storeName) {
        return requestResult(transaction.objectStore(storeName).getAll()).then(function (records) {
          return [storeName, records];
        });
      });
      const entries = await Promise.all(reads);
      await done;
      const data = {};
      entries.forEach(function (entry) { data[entry[0]] = entry[1]; });
      return {
        format: "star-runner-backup",
        formatVersion: 1,
        database: DB_NAME,
        databaseVersion: DB_VERSION,
        createdAt: new Date().toISOString(),
        stores: data
      };
    } finally {
      db.close();
    }
  }

  function validateBackup(backup) {
    if (!backup || backup.format !== "star-runner-backup" || backup.formatVersion !== 1 ||
        !backup.stores || typeof backup.stores !== "object") {
      throw new Error("This file is not a supported Star Runner backup.");
    }
    Object.keys(STORES).forEach(function (name) {
      const storeName = STORES[name];
      const records = backup.stores[storeName];
      if (!Array.isArray(records)) {
        throw new Error("Backup validation failed: missing or invalid " + storeName + " records.");
      }
      const ids = new Set();
      records.forEach(function (record) {
        if (!record || typeof record.id !== "string" || !record.id || ids.has(record.id)) {
          throw new Error("Backup validation failed: invalid or duplicate record ID in " + storeName + ".");
        }
        ids.add(record.id);
      });
    });
    return {
      valid: true,
      createdAt: typeof backup.createdAt === "string" ? backup.createdAt : null,
      counts: Object.keys(STORES).reduce(function (counts, name) {
        const storeName = STORES[name];
        counts[storeName] = backup.stores[storeName].length;
        return counts;
      }, {})
    };
  }

  async function restoreBackup(backup) {
    const validation = validateBackup(backup);
    const storeNames = Object.keys(STORES).map(function (name) { return STORES[name]; });
    const db = await open();
    try {
      const transaction = db.transaction(storeNames, "readwrite");
      const done = transactionDone(transaction);
      storeNames.forEach(function (storeName) {
        const store = transaction.objectStore(storeName);
        store.clear();
        backup.stores[storeName].forEach(function (record) { store.put(record); });
      });
      await done;
      return { restored: true, counts: validation.counts, createdAt: validation.createdAt };
    } finally {
      db.close();
    }
  }

  async function audit() {
    const db = await open();
    try {
      const storeNames = Object.keys(STORES).map(function (name) { return STORES[name]; });
      const transaction = db.transaction(storeNames, "readonly");
      const done = transactionDone(transaction);
      const reads = storeNames.map(function (storeName) {
        return requestResult(transaction.objectStore(storeName).getAll()).then(function (records) {
          return [storeName, records];
        });
      });
      const entries = await Promise.all(reads);
      await done;

      const counts = {};
      const errors = [];
      const warnings = [];
      entries.forEach(function (entry) {
        const storeName = entry[0];
        const records = entry[1];
        counts[storeName] = records.length;
        records.forEach(function (record, index) {
          const label = storeName + " record " + (index + 1);
          if (!record || typeof record !== "object" || Array.isArray(record) ||
              typeof record.id !== "string" || !record.id.trim()) {
            errors.push(label + " has an invalid record ID or structure.");
            return;
          }
          if (storeName === STORES.missions) {
            if (typeof record.title !== "string" || !record.title.trim()) {
              errors.push(label + " is missing a valid mission title.");
            }
            if (record.departure === undefined || record.departure === null || record.departure === "") {
              warnings.push(label + " has no departure date.");
            } else if (typeof record.departure !== "string" ||
                !Number.isFinite(Date.parse(record.departure))) {
              errors.push(label + " has an invalid departure date.");
            }
            const allowedStatuses = ["PLANNED", "ACTIVE", "ON HOLD", "COMPLETE", "COMPLETED", "ABORTED"];
            if (record.status === undefined || record.status === null || record.status === "") {
              warnings.push(label + " has no mission status.");
            } else if (typeof record.status !== "string" || !allowedStatuses.includes(record.status)) {
              errors.push(label + " has an unsupported mission status.");
            }
          }
        });
      });

      return {
        healthy: errors.length === 0,
        checkedAt: new Date().toISOString(),
        counts: counts,
        errors: errors,
        warnings: warnings
      };
    } finally {
      db.close();
    }
  }

  async function initialize() {
    const db = await open();
    try {
      const migration = await migrateLegacyMissions(db);
      return {
        version: "1.0.0",
        database: DB_NAME,
        stores: Object.keys(STORES),
        migration: migration
      };
    } finally {
      db.close();
    }
  }

  root.StarRunnerDataStore = {
    VERSION: "1.0.0",
    DB_NAME: DB_NAME,
    STORES: STORES,
    open: open,
    initialize: initialize,
    migrateLegacyMissions: migrateLegacyMissions,
    getAll: getAll,
    put: put,
    putMany: putMany,
    putMission: putMission,
    putMissions: putMissions,
    putMissionIfUnchanged: putMissionIfUnchanged,
    removeMissionIfUnchanged: removeMissionIfUnchanged,
    getMissionHistory: getMissionHistory,
    removeMission: removeMission,
    remove: remove,
    createBackup: createBackup,
    validateBackup: validateBackup,
    restoreBackup: restoreBackup,
    audit: audit
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
