// SR-23 Chronometer Widget
// Scriptable companion for Star Runner 2.1
// Requires SRGS-Core.js in the Scriptable script library as "SRGS-Core".
// SRGS 1.0 — Apollo 8 epoch, 1968-12-21 12:51:00 UTC.
//
// iOS controls widget refresh timing. refreshAfterDate is a request,
// not a guarantee of continuous or second-by-second updates.

const SRGS = importModule("SRGS-Core");

if (!SRGS || typeof SRGS.fromDate !== "function") {
  throw new Error('SRGS-Core is missing or invalid. Add "SRGS-Core" to Scriptable first.');
}

const now = new Date();
// Use the numeric timestamp to avoid cross-module Date instanceof issues in Scriptable.
const time = SRGS.fromUnixMilliseconds(Date.now());
const widget = new ListWidget();

const colors = {
  backgroundTop: new Color("14263B"),
  backgroundBottom: new Color("080E18"),
  muted: new Color("91A9C2"),
  bright: new Color("B5DDFF"),
  white: new Color("EDF3FB"),
  track: new Color("26364B"),
  accent: new Color("5798D0")
};

const gradient = new LinearGradient();
gradient.colors = [colors.backgroundTop, colors.backgroundBottom];
gradient.locations = [0, 1];
gradient.startPoint = new Point(0, 0);
gradient.endPoint = new Point(1, 1);
widget.backgroundGradient = gradient;
widget.setPadding(14, 16, 14, 16);
widget.url = "https://captren13.github.io/SR-23/";

function addText(parent, value, size, color, font) {
  const item = parent.addText(value);
  item.font = font || Font.regularSystemFont(size);
  item.textColor = color;
  return item;
}

function addProgress(parent, progress, width) {
  const height = 6;
  const draw = new DrawContext();
  draw.size = new Size(width, height);
  draw.opaque = false;
  draw.respectScreenScale = true;

  draw.setFillColor(colors.track);
  draw.fillRoundedRect(new Rect(0, 0, width, height), height / 2);

  const fillWidth = Math.max(2, Math.min(width, width * progress));
  const barGradient = new LinearGradient();
  barGradient.colors = [colors.accent, colors.bright];
  barGradient.locations = [0, 1];
  barGradient.startPoint = new Point(0, 0);
  barGradient.endPoint = new Point(width, 0);
  draw.setFillColor(barGradient);
  draw.fillRoundedRect(new Rect(0, 0, fillWidth, height), height / 2);

  parent.addImage(draw.getImage());
}

function addMetric(parent, label, value) {
  const column = parent.addStack();
  column.layoutVertically();
  addText(column, label, 8, colors.muted, Font.mediumSystemFont(8));
  column.addSpacer(3);
  addText(column, value, 15, colors.white, Font.semiboldSystemFont(15));
  return column;
}

const family = config.widgetFamily || "medium";

addText(widget, "STAR RUNNER  /  SR-23", 9, colors.muted, Font.boldSystemFont(9));
widget.addSpacer(8);

if (family === "small") {
  addText(widget, "STARDATE", 8, colors.muted, Font.mediumSystemFont(8));
  widget.addSpacer(3);
  addText(widget, time.stardate, 24, colors.bright, Font.boldSystemFont(24));
  widget.addSpacer(7);
  addText(widget, "GST  " + time.gst, 11, colors.white, Font.semiboldSystemFont(11));
  widget.addSpacer();
  addText(widget, "SRGS 1.0  •  LOCAL CLOCK", 7, colors.muted, Font.mediumSystemFont(7));
} else {
  addText(widget, "CURRENT GALACTIC STARDATE", 8, colors.muted, Font.mediumSystemFont(8));
  widget.addSpacer(2);
  addText(widget, time.stardate, family === "large" ? 34 : 30, colors.bright,
    Font.boldSystemFont(family === "large" ? 34 : 30));
  widget.addSpacer(7);

  const metrics = widget.addStack();
  metrics.layoutHorizontally();
  addMetric(metrics, "BLOCK", String(time.block).padStart(3, "0"));
  metrics.addSpacer();
  addMetric(metrics, "GROUP", String(time.group).padStart(2, "0"));
  metrics.addSpacer();
  addMetric(metrics, "CYCLE", String(time.cycle).padStart(2, "0"));

  widget.addSpacer(8);
  const gstRow = widget.addStack();
  gstRow.layoutHorizontally();
  addText(gstRow, "GALACTIC STANDARD TIME", 8, colors.muted, Font.mediumSystemFont(8));
  gstRow.addSpacer();
  addText(gstRow, time.gst, 11, colors.bright, Font.semiboldSystemFont(11));

  widget.addSpacer(5);
  const progressRow = widget.addStack();
  progressRow.layoutHorizontally();
  addText(progressRow, "CYCLE PROGRESS", 8, colors.muted, Font.mediumSystemFont(8));
  progressRow.addSpacer();
  addText(progressRow, (time.cycleProgress * 100).toFixed(2) + "%", 8,
    colors.bright, Font.semiboldSystemFont(8));
  widget.addSpacer(4);
  addProgress(widget, time.cycleProgress, family === "large" ? 300 : 280);

  if (family === "large") {
    widget.addSpacer(10);
    const earth = widget.addStack();
    earth.layoutHorizontally();
    addText(earth, "EARTH UTC", 8, colors.muted, Font.mediumSystemFont(8));
    earth.addSpacer();
    addText(earth, now.toISOString().replace("T", " ").replace("Z", " UTC").slice(0, 23),
      8, colors.white, Font.mediumSystemFont(8));
    widget.addSpacer(4);
    addText(widget, "EPOCH 000  •  APOLLO 8  •  21 DEC 1968",
      7, colors.muted, Font.mediumSystemFont(7));
  }
}

widget.addSpacer();
const footer = widget.addText("GALACTIC STANDARD  •  SRGS 1.0");
footer.font = Font.mediumSystemFont(7);
footer.textColor = colors.muted;
footer.centerAlignText();

// Ask iOS to refresh soon; the system decides the actual refresh schedule.
widget.refreshAfterDate = new Date(Date.now() + 5 * 60 * 1000);

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentMedium();
}

Script.complete();
