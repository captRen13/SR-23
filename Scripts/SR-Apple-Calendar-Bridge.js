// Star Runner — Apple Calendar Bridge
// Phase 4B.1 | Read-only calendar export for SR-23
// Select only the Personal, Family, and Work calendars you want imported.
// This script reads events and writes a JSON export to Scriptable's iCloud Drive folder.
// It never creates, edits, or deletes Apple Calendar events.

const LOOKBACK_DAYS = 30;
const LOOKAHEAD_DAYS = 90;
const EXPORT_PREFIX = "SR-Apple-Calendar-Export";

async function main() {
  const selectedCalendars = await Calendar.presentPicker(true);

  if (!selectedCalendars || selectedCalendars.length === 0) {
    await showMessage("No calendars selected", "No data was exported.");
    return;
  }

  // Allow the native calendar-picker dismissal animation to finish before
  // presenting another modal. Without this pause, Scriptable can remain
  // suspended after the picker returns on some iOS/device combinations.
  await new Promise(resolve => Timer.schedule(1, false, resolve));

  const names = selectedCalendars.map(calendar => calendar.title);
  const confirm = new Alert();
  confirm.title = "Confirm Calendar Sources";
  confirm.message =
    "Only the calendars listed below will be read:\n\n" +
    names.map(name => "• " + name).join("\n") +
    "\n\nThe export includes events from the previous " +
    LOOKBACK_DAYS + " days through the next " + LOOKAHEAD_DAYS +
    " days. Apple Calendar will not be modified.";
  confirm.addAction("Export Events");
  confirm.addCancelAction("Cancel");

  const choice = await confirm.presentAlert();
  if (choice !== 0) {
    await showMessage("Export canceled", "No calendar data was exported.");
    return;
  }

  const now = new Date();
  const start = new Date(now.getTime() - LOOKBACK_DAYS * 86400000);
  const end = new Date(now.getTime() + LOOKAHEAD_DAYS * 86400000);

  const events = await CalendarEvent.between(start, end, selectedCalendars);

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

  const fm = FileManager.iCloud();
  const directory = fm.documentsDirectory();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = EXPORT_PREFIX + "-" + stamp + ".json";
  const path = fm.joinPath(directory, fileName);

  fm.writeString(path, JSON.stringify(payload, null, 2));

  const result = new Alert();
  result.title = "SR-23 Calendar Export Ready";
  result.message =
    records.length + " event(s) exported from " +
    selectedCalendars.length + " calendar(s).\n\n" +
    "File: " + fileName + "\n\n" +
    "Saved in Scriptable's iCloud Drive folder. No Apple Calendar events were changed.";
  result.addAction("Done");
  await result.presentAlert();
}

async function showMessage(title, message) {
  const alert = new Alert();
  alert.title = title;
  alert.message = message;
  alert.addAction("OK");
  await alert.presentAlert();
}

await main();
Script.complete();
