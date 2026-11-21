-- SR-23 Chronometer engine for Rainmeter
-- SRGS 1.0 | Epoch 000: Apollo 8, 1968-12-21 12:51:00 UTC
-- 1 Galactic Cycle = 100,000 SI seconds
-- 100 Cycles = 1 Group; 100 Groups = 1 Block

local EPOCH_UNIX = -32440140
local CYCLE_SECONDS = 100000
local CYCLES_PER_GROUP = 100
local GROUPS_PER_BLOCK = 100
local CYCLES_PER_BLOCK = CYCLES_PER_GROUP * GROUPS_PER_BLOCK

local function pad(value, width)
    return string.format("%0" .. tostring(width) .. "d", value)
end

local function set(name, value)
    SKIN:Bang("!SetVariable", name, tostring(value))
end

function Initialize()
    return 0
end

function Update()
    local now = os.time()
    local elapsed = math.max(0, now - EPOCH_UNIX)
    local totalCycles = math.floor(elapsed / CYCLE_SECONDS)
    local cycleElapsed = elapsed % CYCLE_SECONDS

    local block = math.floor(totalCycles / CYCLES_PER_BLOCK)
    local group = math.floor((totalCycles % CYCLES_PER_BLOCK) / CYCLES_PER_GROUP)
    local cycle = totalCycles % CYCLES_PER_GROUP

    local interval = math.floor(cycleElapsed / 10000)
    local segment = math.floor((cycleElapsed % 10000) / 100)
    local unit = cycleElapsed % 100
    local tick = 0

    local stardate = pad(block, 3) .. "." .. pad(group, 2) .. "." .. pad(cycle, 2)
    local gst = pad(interval, 2) .. "." .. pad(segment, 2) .. "." .. pad(unit, 2) .. "." .. pad(tick, 2)
    local progress = (cycleElapsed / CYCLE_SECONDS) * 100

    set("Stardate", stardate)
    set("GST", gst)
    set("Block", pad(block, 3))
    set("Group", pad(group, 2))
    set("Cycle", pad(cycle, 2))
    set("Progress", string.format("%.2f", progress))
    set("Elapsed", string.format("%d", elapsed))

    local utc = os.date("!*t", now)
    set("UTC", string.format("%02d:%02d:%02d UTC", utc.hour, utc.min, utc.sec))
    set("EarthDate", string.format("%04d-%02d-%02d", utc.year, utc.month, utc.day))

    SKIN:Bang("!UpdateMeterGroup", "Dynamic")
    SKIN:Bang("!UpdateMeter", "MeterProgressFill")
    SKIN:Bang("!Redraw")

    return 0
end
