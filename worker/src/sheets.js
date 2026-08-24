/**
 * Thin wrapper around the Google Sheets API v4 (values.get / values.append),
 * treating each habit's Sheet as a plain header-row + rows table. The
 * header row IS the schema - whatever columns exist become entry object
 * keys - so adding a new habit needs zero changes here, only a new Sheet
 * and a new `_data/habits/<slug>.json` schema-config (see habitConfigs.js).
 */

import { getAccessToken } from "./googleAuth.js";

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

// First tab of the sheet, all columns. Habits with a single tab (the
// expected shape - "one Sheet per habit") don't need a specific tab name.
const RANGE = "A:Z";

function coerceCell(value) {
  if (value === "" || value === undefined) return null;
  if (value !== "" && !Number.isNaN(Number(value))) return Number(value);
  return value;
}

// Reads all rows and turns them into entry objects keyed by the header row,
// e.g. ["date", "time", "score"] + ["2026-08-04", "", "3939"] ->
// { date: "2026-08-04", time: null, score: 3939 }.
export async function readSheetEntries(env, sheetId) {
  const token = await getAccessToken(env);
  const url = `${SHEETS_API}/${sheetId}/values/${encodeURIComponent(RANGE)}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Sheets read failed (${response.status}): ${body}`);
  }
  const data = await response.json();
  const [header, ...rows] = data.values || [];
  if (!header) return [];

  return rows
    .filter((row) => row.length && row.some((cell) => cell !== ""))
    .map((row) => {
      const entry = {};
      header.forEach((key, i) => {
        entry[key] = coerceCell(row[i]);
      });
      return entry;
    });
}

// Appends one row, in header-column order, filling any column the entry
// doesn't have with an empty cell. Returns nothing - caller re-reads (or
// invalidates its cache) if it needs the fresh row list.
export async function appendSheetEntry(env, sheetId, entry) {
  const token = await getAccessToken(env);

  const headerUrl = `${SHEETS_API}/${sheetId}/values/${encodeURIComponent("A1:Z1")}`;
  const headerResponse = await fetch(headerUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!headerResponse.ok) {
    const body = await headerResponse.text();
    throw new Error(`Sheets header read failed (${headerResponse.status}): ${body}`);
  }
  const headerData = await headerResponse.json();
  const header = (headerData.values && headerData.values[0]) || [];
  if (!header.length) {
    throw new Error(
      "Sheet has no header row - add one (e.g. date,time,score,...) before appending."
    );
  }

  const row = header.map((key) => (entry[key] === undefined || entry[key] === null ? "" : entry[key]));

  const appendUrl = `${SHEETS_API}/${sheetId}/values/${encodeURIComponent(RANGE)}:append?valueInputOption=RAW`;
  const appendResponse = await fetch(appendUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [row] }),
  });
  if (!appendResponse.ok) {
    const body = await appendResponse.text();
    throw new Error(`Sheets append failed (${appendResponse.status}): ${body}`);
  }
}
