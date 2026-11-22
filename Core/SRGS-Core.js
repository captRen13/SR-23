// Star Runner Galactic Standard — Core Engine
// File: Core/SRGS-Core.js
// Version: 1.0.0
// Epoch: Apollo 8 launch, 1968-12-21 12:51:00 UTC
// Galactic Cycle: 100,000 SI seconds
// Hierarchy: 100 Cycles = 1 Group; 100 Groups = 1 Block
// GST: 10 Intervals × 100 Segments × 100 Units × 100 Ticks
// Tick duration: 0.01 SI seconds
//
// This file is intentionally dependency-free and can be used by:
// - Scriptable via importModule("SRGS-Core")
// - Browser applications via the globalThis.SRGSCore object

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.SRGSCore = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "1.0.0";
  const EPOCH_UTC_MS = Date.UTC(1968, 11, 21, 12, 51, 0);
  const CYCLE_SECONDS = 100000;
  const CYCLE_MS = CYCLE_SECONDS * 1000;
  const CYCLES_PER_GROUP = 100;
  const GROUPS_PER_BLOCK = 100;
  const CYCLES_PER_BLOCK = CYCLES_PER_GROUP * GROUPS_PER_BLOCK;

  const GST_INTERVAL_SECONDS = 10000;
  const GST_SEGMENT_SECONDS = 100;
  const GST_UNIT_SECONDS = 1;
  const GST_TICK_SECONDS = 0.01;

  function pad(value, width) {
    return String(value).padStart(width || 2, "0");
  }

  function assertFiniteNumber(value, label) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new TypeError((label || "Value") + " must be a finite number.");
    }
  }

  function fromUnixMilliseconds(unixMs) {
    assertFiniteNumber(unixMs, "Unix timestamp");
    const elapsedMs = unixMs - EPOCH_UTC_MS;

    if (elapsedMs < 0) {
      throw new RangeError("Date is before Galactic Epoch 000.");
    }

    const totalCycles = Math.floor(elapsedMs / CYCLE_MS);
    const withinCycleMs = elapsedMs % CYCLE_MS;

    const block = Math.floor(totalCycles / CYCLES_PER_BLOCK);
    const group = Math.floor(
      (totalCycles % CYCLES_PER_BLOCK) / CYCLES_PER_GROUP
    );
    const cycle = totalCycles % CYCLES_PER_GROUP;

    const withinCycleSeconds = withinCycleMs / 1000;
    const interval = Math.floor(withinCycleSeconds / GST_INTERVAL_SECONDS);
    const afterInterval = withinCycleSeconds % GST_INTERVAL_SECONDS;
    const segment = Math.floor(afterInterval / GST_SEGMENT_SECONDS);
    const afterSegment = afterInterval % GST_SEGMENT_SECONDS;
    const unit = Math.floor(afterSegment / GST_UNIT_SECONDS);
    const tick = Math.floor(
      (afterSegment % GST_UNIT_SECONDS) / GST_TICK_SECONDS + 1e-8
    );

    return {
      version: VERSION,
      epoch: "1968-12-21T12:51:00.000Z",
      unixMilliseconds: unixMs,
      elapsedMilliseconds: elapsedMs,
      elapsedSeconds: elapsedMs / 1000,
      totalCycles: totalCycles,
      block: block,
      group: group,
      cycle: cycle,
      interval: interval,
      segment: segment,
      unit: unit,
      tick: tick,
      stardate: pad(block, 3) + "." + pad(group) + "." + pad(cycle),
      gst: pad(interval) + "." + pad(segment) + "." + pad(unit) + "." + pad(tick),
      cycleProgress: withinCycleMs / CYCLE_MS
    };
  }

  function fromDate(date) {
    if (!(date instanceof Date) || !Number.isFinite(date.getTime())) {
      throw new TypeError("Expected a valid JavaScript Date.");
    }
    return fromUnixMilliseconds(date.getTime());
  }

  function toUnixMilliseconds(block, group, cycle, interval, segment, unit, tick) {
    const values = [block, group, cycle, interval, segment, unit, tick];
    const names = ["Block", "Group", "Cycle", "Interval", "Segment", "Unit", "Tick"];

    values.forEach(function (value, index) {
      if (!Number.isInteger(value) || value < 0) {
        throw new RangeError(names[index] + " must be a non-negative integer.");
      }
    });

    if (group >= GROUPS_PER_BLOCK) throw new RangeError("Group must be 0–99.");
    if (cycle >= CYCLES_PER_GROUP) throw new RangeError("Cycle must be 0–99.");
    if (interval >= 10) throw new RangeError("Interval must be 0–9.");
    if (segment >= 100) throw new RangeError("Segment must be 0–99.");
    if (unit >= 100) throw new RangeError("Unit must be 0–99.");
    if (tick >= 100) throw new RangeError("Tick must be 0–99.");

    const totalCycles =
      block * CYCLES_PER_BLOCK +
      group * CYCLES_PER_GROUP +
      cycle;

    const withinCycleMs =
      interval * GST_INTERVAL_SECONDS * 1000 +
      segment * GST_SEGMENT_SECONDS * 1000 +
      unit * GST_UNIT_SECONDS * 1000 +
      tick * GST_TICK_SECONDS * 1000;

    return EPOCH_UTC_MS + totalCycles * CYCLE_MS + withinCycleMs;
  }

  function parseStardate(value) {
    if (typeof value !== "string") {
      throw new TypeError("Stardate must be a string in Block.Group.Cycle format.");
    }

    const match = value.trim().match(/^(\d+)\.(\d{1,2})\.(\d{1,2})$/);
    if (!match) {
      throw new RangeError("Use Block.Group.Cycle format, for example 001.82.77.");
    }

    const block = Number(match[1]);
    const group = Number(match[2]);
    const cycle = Number(match[3]);

    if (!Number.isSafeInteger(block)) throw new RangeError("Block is too large.");
    if (group > 99) throw new RangeError("Group must be 00–99.");
    if (cycle > 99) throw new RangeError("Cycle must be 00–99.");

    return { block: block, group: group, cycle: cycle };
  }

  function stardateToUnixMilliseconds(value) {
    const parts = parseStardate(value);
    return toUnixMilliseconds(parts.block, parts.group, parts.cycle, 0, 0, 0, 0);
  }

  function toDate(parts) {
    if (!parts || typeof parts !== "object") {
      throw new TypeError("Expected an SRGS date-parts object.");
    }
    return new Date(
      toUnixMilliseconds(
        parts.block,
        parts.group,
        parts.cycle,
        parts.interval || 0,
        parts.segment || 0,
        parts.unit || 0,
        parts.tick || 0
      )
    );
  }

  function selfTest() {
    const checks = [];
    function check(name, condition, detail) {
      checks.push({ name: name, passed: !!condition, detail: detail || "" });
    }

    const epoch = fromUnixMilliseconds(EPOCH_UTC_MS);
    check("Epoch Stardate", epoch.stardate === "000.00.00", epoch.stardate);
    check("Epoch GST", epoch.gst === "00.00.00.00", epoch.gst);

    const oneCycle = fromUnixMilliseconds(EPOCH_UTC_MS + CYCLE_MS);
    check("One-cycle boundary", oneCycle.stardate === "000.00.01", oneCycle.stardate);

    const oneInterval = fromUnixMilliseconds(EPOCH_UTC_MS + 10000 * 1000);
    check("GST interval boundary", oneInterval.gst === "01.00.00.00", oneInterval.gst);

    const oneTick = fromUnixMilliseconds(EPOCH_UTC_MS + 10);
    check("Ten-millisecond tick", oneTick.gst === "00.00.00.01", oneTick.gst);

    const roundTrip = stardateToUnixMilliseconds("001.82.77");
    const roundTripParts = fromUnixMilliseconds(roundTrip);
    check("Stardate round trip", roundTripParts.stardate === "001.82.77", roundTripParts.stardate);

    let rejectsPreEpoch = false;
    try {
      fromUnixMilliseconds(EPOCH_UTC_MS - 1);
    } catch (error) {
      rejectsPreEpoch = error instanceof RangeError;
    }
    check("Pre-epoch rejection", rejectsPreEpoch, "Dates before Epoch 000 must be rejected.");

    return {
      version: VERSION,
      passed: checks.every(function (item) { return item.passed; }),
      checks: checks
    };
  }

  return {
    VERSION: VERSION,
    EPOCH_UTC_MS: EPOCH_UTC_MS,
    CYCLE_SECONDS: CYCLE_SECONDS,
    CYCLE_MS: CYCLE_MS,
    CYCLES_PER_GROUP: CYCLES_PER_GROUP,
    GROUPS_PER_BLOCK: GROUPS_PER_BLOCK,
    fromDate: fromDate,
    fromUnixMilliseconds: fromUnixMilliseconds,
    toDate: toDate,
    toUnixMilliseconds: toUnixMilliseconds,
    parseStardate: parseStardate,
    stardateToUnixMilliseconds: stardateToUnixMilliseconds,
    selfTest: selfTest
  };
});
