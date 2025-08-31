// DownloadFamilyTreeExcel.jsx
import React from "react";
import ExcelJS from "exceljs"; // if bundler errors, try 'exceljs/dist/exceljs.min.js'
import { saveAs } from "file-saver";

/* Palette (column colors) */
const colors = [
  "#fef08a", // warm yellow
  "#93c5fd", // sky blue
  "#86efac", // mint green
  "#fda4af", // rose pink
  "#c4b5fd", // soft violet
  "#fca5a5", // coral red
  "#5eead4", // teal
  "#f9a8d4", // magenta pink
  "#a5f3fc", // light cyan
  "#fcd34d", // amber
];

/* Return '000000' or 'FFFFFF' depending on luminance for readable text */
function getContrastColor(hex) {
  if (!hex) return "000000";
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "000000" : "FFFFFF";
}

/* Build rows where each row is a path root -> leaf.
   Each element in a row is the cell for that level; spouses concatenated with '-' */
const buildRowsByLevels = (nodes, path = [], rows = []) => {
  for (const n of nodes || []) {
    const nodeName = n?.name || "";
    const nodeLabel = n?.spouses?.length ? `${nodeName}-${n.spouses.join("-")}` : nodeName;
    const currentPath = [...path, nodeLabel];

    if (n?.children?.length) {
      buildRowsByLevels(n.children, currentPath, rows);
    } else {
      rows.push(currentPath);
    }
  }
  return rows;
};

export default function DownloadFamilyTreeExcel({ tree }) {
  const handleDownload = async () => {
    if (!tree || typeof tree !== "object") {
      alert("No tree provided to export.");
      return;
    }

    // Root label (father-mother)
    const rootName = tree.mother ? `${tree.father || ""}-${tree.mother || ""}` : (tree.father || "");

    // Build path rows from children; if no children, display root alone
    let rows = [];
    if (Array.isArray(tree.children) && tree.children.length > 0) {
      rows = buildRowsByLevels(tree.children, [rootName]);
    } else {
      rows = [[rootName]];
    }
    if (!rows || rows.length === 0) rows = [[rootName]];

    const maxDepth = Math.max(...rows.map((r) => r.length), 1);
    const headers = Array.from({ length: maxDepth }, (_, i) => `Level ${i}`);

    // Normalize rows to equal length
    const normalized = rows.map((r) => {
      const copy = [...r];
      while (copy.length < maxDepth) copy.push("");
      return copy;
    });

    // Create workbook & worksheet
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("FamilyTree");

    // Prepare columns with widths estimated from content
    const columns = headers.map((h, c) => {
      let maxLen = String(h).length;
      for (let r = 0; r < normalized.length; r++) {
        const v = normalized[r][c];
        if (v && v.toString().length > maxLen) maxLen = v.toString().length;
      }
      return { header: h, key: `c${c}`, width: Math.min(Math.max(maxLen + 2, 12), 50) };
    });
    ws.columns = columns;

    // Add header row (ExcelJS will create automatically from ws.columns if desired,
    // but we add explicitly to be able to style)
    const headerRow = ws.getRow(1);
    headers.forEach((h, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = h;
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF333333" },
      };
      cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    headerRow.height = 20;

    // Add data rows starting from Excel row 2
    for (let i = 0; i < normalized.length; i++) {
      const rowValues = normalized[i].map((v) => v || "");
      const excelRow = ws.getRow(i + 2);
      // set values cell-by-cell to preserve alignment with columns
      for (let c = 0; c < maxDepth; c++) {
        const cell = excelRow.getCell(c + 1);
        cell.value = rowValues[c] || "";
        const bgHex = colors[c % colors.length] || "#FFFFFF";
        const argb = "FF" + bgHex.replace("#", "").toUpperCase();
        const contrast = getContrastColor(bgHex);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
        cell.font = { color: { argb: "FF" + contrast }, bold: false };
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      }
      excelRow.commit();
    }

    // Merge identical consecutive cells vertically in each column (skip header row 1)
    const totalRows = normalized.length + 1; // including header
    for (let c = 0; c < maxDepth; c++) {
      let start = 2; // data starts at row 2
      while (start <= totalRows) {
        const startVal = ws.getCell(start, c + 1).value;
        if (!startVal || startVal === "") {
          start++;
          continue;
        }
        let end = start;
        while (end + 1 <= totalRows && ws.getCell(end + 1, c + 1).value === startVal) {
          end++;
        }
        if (end > start) {
          ws.mergeCells(start, c + 1, end, c + 1);
          // after merging, style the merged cell (top-left)
          const mergedCell = ws.getCell(start, c + 1);
          // ensure same fill/font/alignment are present (they inherit but reinforce)
          const bgHex = colors[c % colors.length] || "#FFFFFF";
          const argb = "FF" + bgHex.replace("#", "").toUpperCase();
          const contrast = getContrastColor(bgHex);
          mergedCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
          mergedCell.font = { color: { argb: "FF" + contrast }, bold: false };
          mergedCell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        }
        start = end + 1;
      }
    }

    // Freeze header row
    ws.views = [{ state: "frozen", ySplit: 1 }];

    // Write workbook to buffer and save
    try {
      const buffer = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buffer], { type: "application/octet-stream" }), "FamilyTree.xlsx");
    } catch (err) {
      console.error("Failed to generate Excel:", err);
      alert("Failed to generate Excel. See console for details.");
    }
  };

  return (
    <button onClick={handleDownload} className="ft-btn ft-btn-indigo">
      ⤓ Download Excel
    </button>
  );
}
