// SR-23 Galactic Stardate Widget
// Scriptable for iPhone — SRGS 1.0
// Epoch: Apollo 8 launch, 1968-12-21 12:51:00 UTC
// 1 Galactic Cycle = 100,000 SI seconds.
// Note: uses the iPhone's system clock; this is not an independently synchronized clock.

const EPOCH_UTC_MS = Date.UTC(1968, 11, 21, 12, 51, 0);
const CYCLE_MS = 100000 * 1000;
const GROUP_CYCLES = 100;
const BLOCK_CYCLES = 10000;

function pad(value, width = 2) {
  return String(value).padStart(width, "0");
}

function getGalacticDate(nowMs) {
  const elapsedMs = Math.max(0, nowMs - EPOCH_UTC_MS);
  const totalCycles = Math.floor(elapsedMs / CYCLE_MS);

  const block = Math.floor(totalCycles / BLOCK_CYCLES);
  const group = Math.floor((totalCycles % BLOCK_CYCLES) / GROUP_CYCLES);
  const cycle = totalCycles % GROUP_CYCLES;

  const cycleElapsedMs = elapsedMs % CYCLE_MS;
  const progress = cycleElapsedMs / CYCLE_MS;

  return {
    stardate: `${pad(block, 3)}.${pad(group)}.${pad(cycle)}`,
    block,
    group,
    cycle,
    progress,
    elapsedSeconds: Math.floor(elapsedMs / 1000)
  };
}

function addProgressBar(widget, progress, width) {
  const height = 7;
  const context = new DrawContext();
  context.size = new Size(width, height);
  context.opaque = false;
  context.respectScreenScale = true;

  const fullRect = new Rect(0, 0, width, height);
  context.setFillColor(new Color("26364B"));
  context.fillRoundedRect(fullRect, 3.5);

  const fillWidth = Math.max(5, width * Math.min(1, Math.max(0, progress)));
  const fillRect = new Rect(0, 0, fillWidth, height);
  const gradient = new LinearGradient();
  gradient.colors = [new Color("5798D0"), new Color("B5DDFF")];
  gradient.locations = [0, 1];
  gradient.startPoint = new Point(0, 0);
  gradient.endPoint = new Point(width, 0);
  context.setFillColor(gradient);
  context.fillRoundedRect(fillRect, 3.5);

  widget.addImage(context.getImage());
}

function makeText(widget, value, size, color, font = Font.regularSystemFont(size)) {
  const item = widget.addText(value);
  item.font = font;
  item.textColor = new Color(color);
  return item;
}

const now = new Date();
const galactic = getGalacticDate(now.getTime());
const widget = new ListWidget();

const background = new LinearGradient();
background.colors = [new Color("14263B"), new Color("080E18")];
background.locations = [0, 1];
background.startPoint = new Point(0, 0);
background.endPoint = new Point(1, 1);
widget.backgroundGradient = background;
widget.setPadding(14, 16, 14, 16);
widget.url = "https://captren13.github.io/SR-23/";

const family = config.widgetFamily || "medium";

if (family === "small") {
  makeText(widget, "SR-23  /  CHRONOMETER", 9, "9DB4CC", Font.boldSystemFont(9));
  widget.addSpacer(10);
  makeText(widget, "CURRENT STARDATE", 9, "9DB4CC", Font.mediumSystemFont(9));
  widget.addSpacer(3);
  makeText(widget, galactic.stardate, 25, "B5DDFF", Font.boldSystemFont(25));
  widget.addSpacer(5);
  makeText(widget, "SRGS 1.0  •  GALACTIC TIME", 8, "8297AF", Font.mediumSystemFont(8));
} else {
  makeText(widget, "SR-23  /  CHRONOMETER", 10, "9DB4CC", Font.boldSystemFont(10));
  widget.addSpacer(9);
  makeText(widget, "CURRENT GALACTIC STARDATE", 9, "9DB4CC", Font.mediumSystemFont(9));
  widget.addSpacer(2);
  makeText(widget, galactic.stardate, family === "large" ? 34 : 31, "B5DDFF",
    Font.boldSystemFont(family === "large" ? 34 : 31));
  widget.addSpacer(7);

  const details = widget.addStack();
  details.layoutHorizontally();
  const left = details.addStack();
  left.layoutVertically();
  const t1 = left.addText("BLOCK");
  t1.font = Font.mediumSystemFont(8);
  t1.textColor = new Color("8297AF");
  const v1 = left.addText(pad(galactic.block, 3));
  v1.font = Font.semiboldSystemFont(14);
  v1.textColor = new Color("EDF3FB");

  details.addSpacer();

  const middle = details.addStack();
  middle.layoutVertically();
  const t2 = middle.addText("GROUP");
  t2.font = Font.mediumSystemFont(8);
  t2.textColor = new Color("8297AF");
  const v2 = middle.addText(pad(galactic.group));
  v2.font = Font.semiboldSystemFont(14);
  v2.textColor = new Color("EDF3FB");

  details.addSpacer();

  const right = details.addStack();
  right.layoutVertically();
  const t3 = right.addText("CYCLE");
  t3.font = Font.mediumSystemFont(8);
  t3.textColor = new Color("8297AF");
  const v3 = right.addText(pad(galactic.cycle));
  v3.font = Font.semiboldSystemFont(14);
  v3.textColor = new Color("EDF3FB");

  widget.addSpacer(9);
  const progressLabel = widget.addStack();
  progressLabel.layoutHorizontally();
  const progressTitle = progressLabel.addText("CYCLE PROGRESS");
  progressTitle.font = Font.mediumSystemFont(8);
  progressTitle.textColor = new Color("8297AF");
  progressLabel.addSpacer();
  const progressValue = progressLabel.addText((galactic.progress * 100).toFixed(2) + "%");
  progressValue.font = Font.semiboldSystemFont(9);
  progressValue.textColor = new Color("B5DDFF");
  widget.addSpacer(5);
  addProgressBar(widget, galactic.progress, family === "large" ? 300 : 280);

  if (family === "large") {
    widget.addSpacer(10);
    const epoch = widget.addText("GALACTIC EPOCH 000");
    epoch.font = Font.mediumSystemFont(8);
    epoch.textColor = new Color("8297AF");
    widget.addSpacer(3);
    const anchor = widget.addText("APOLLO 8  •  21 DEC 1968  •  12:51:00 UTC");
    anchor.font = Font.mediumSystemFont(8);
    anchor.textColor = new Color("9DB4CC");
  }
}

widget.addSpacer();
const footer = widget.addText("STAR RUNNER GALACTIC STANDARD  •  SRGS 1.0");
footer.font = Font.mediumSystemFont(7);
footer.textColor = new Color("71869E");
footer.centerAlignText();

widget.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentMedium();
}
Script.complete();
