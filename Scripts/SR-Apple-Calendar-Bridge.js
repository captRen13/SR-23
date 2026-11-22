// Star Runner — Apple Calendar Bridge
// Phase 4B.1 | Read-only calendar export for SR-23
// Select the Personal, Family, and Work calendars you want imported.
// Reads events and writes a JSON export to Scriptable's iCloud Drive folder.
// This script never creates, edits, or deletes Apple Calendar events.
//
// Progress and errors are reported in the Scriptable console.
// No follow-up alerts are presented, avoiding modal handoff issues.

const LOOKBACK_DAYS = 30;
const LOOKAHEAD_DAYS = 90;
const EXPORT_PREFIX = "SR-Apple-Calendar-Export";

async function main() {
  console.log("SR-23 Calendar Bridge starting.");

  console.log("Opening calendar picker...");
  const selectedCalendars = await Calendar.presentPicker(true);

  if (!selectedCalendars || selectedCalendars.length === 0) {
    console.log("No calendars selected. Nothing exported.");
    return;
  }

  console.log(
    "Selected " + selectedCalendars.length + " calendar(s): " +
    selectedCalendars.map(calendar => calendar.title).join(", ")
  );

  const now = new Date();
  const start = new Date(now.getTime() - LOOKBACK_DAYS * 86400000);
  const end = new Date(now.getTime() + LOOKAHEAD_DAYS * 86400000);

  console.log("Retrieving calendar events...");
  const events = await CalendarEvent.between(start, end, selectedCalendars);
  console.log("Retrieved " + events.length + " event(s).");

  const records = events.map(event => ({
    id: String(event.calendar.identifier) + "::" + String(event.identifier),
    source: "apple-calendar",
    sourceEventIdentifier: String(event.identifier),
    calendarIdentifier: String(event.calendar.identifier),
    calendarTitle: String(event.calendar.title),
    title: String(event.title || "Untitled Event"),
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    timeZone: event.timeZone || null,
    isAllDay: Boolean(event.isAllDay),
    location: event.location || "",
    notes: event.notes || "",
    availability: event.availability || null
  }));

  records.sort((a, b) => a.startDate.localeCompare(b.startDate));

  const payload = {
    format: "star-runner-apple-calendar",
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    range: {
      start: start.toISOString(),
      end: end.toISOString(),
      lookbackDays: LOOKBACK_DAYS,
      lookaheadDays: LOOKAHEAD_DAYS
    },
    selectedCalendars: selectedCalendars.map(calendar => ({
      identifier: String(calendar.identifier),
      title: String(calendar.title)
    })),
    eventCount: records.length,
    events: records
  };

  console.log("Preparing JSON export...");
  const fm = FileManager.iCloud();
  const directory = fm.documentsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = EXPORT_PREFIX + "-" + stamp + ".json";
  const path = fm.joinPath(directory, fileName);

  fm.writeString(path, JSON.stringify(payload, null, 2));

  console.log("EXPORT SUCCESSFUL.");
  console.log("Events: " + records.length);
  console.log("Calendars: " + selectedCalendars.length);
  console.log("File: " + fileName);
  console.log("Path: " + path);
  console.log("Apple Calendar was not modified.");
}

try {
  await main();
} catch (error) {
  console.error("SR-23 Calendar Bridge failed:");
  console.error(String(error));
} finally {
  Script.complete();
}
