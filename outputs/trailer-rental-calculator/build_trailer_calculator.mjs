import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "/Users/Payton/web-development/sunsouth-web-solutions/outputs/trailer-rental-calculator";
const outputPath = `${outputDir}/bham_20ft_enclosed_trailer_rental_calculator.xlsx`;

const workbook = Workbook.create();
const calc = workbook.worksheets.add("Calculator");
const rates = workbook.worksheets.add("Rate Setup");
const notes = workbook.worksheets.add("Source Notes");

for (const sheet of [calc, rates, notes]) {
  sheet.showGridLines = false;
}

calc.getRange("A1:F1").values = [["20 Ft Enclosed Trailer Rental Calculator", "", "", "", "", ""]];
calc.mergeCells("A1:F1");
calc.getRange("A1:F1").format = {
  fill: { color: "#1F3A5F" },
  font: { color: "#17324D", bold: true, size: 16 },
  horizontalAlignment: "left",
  verticalAlignment: "center",
};
calc.getRange("A1:F1").format.rowHeightPx = 36;

calc.getRange("A3:F3").values = [["Inputs", "", "", "Calculated Rental Cost", "", ""]];
calc.mergeCells("A3:C3");
calc.mergeCells("D3:F3");
calc.getRange("A3:F3").format = {
  fill: { color: "#D7E3F2" },
  font: { bold: true, color: "#17324D" },
  horizontalAlignment: "center",
};

calc.getRange("A4:B9").values = [
  ["Pickup Date", new Date(2026, 5, 10)],
  ["Pickup Time (optional)", ""],
  ["Return Date", new Date(2026, 5, 17)],
  ["Return Time (optional)", ""],
  ["Grace Threshold (hours)", 1],
  ["Tax / Fee Rate", 0],
];
calc.getRange("A4:A9").format = { font: { bold: true }, fill: { color: "#F3F6FA" } };
calc.getRange("B4:B9").format = { fill: { color: "#FFF6C7" } };
calc.getRange("B4").setNumberFormat("yyyy-mm-dd");
calc.getRange("B6").setNumberFormat("yyyy-mm-dd");
calc.getRange("B5").setNumberFormat("h:mm AM/PM");
calc.getRange("B7").setNumberFormat("h:mm AM/PM");
calc.getRange("B8").setNumberFormat("0.0");
calc.getRange("B9").setNumberFormat("0.0%");

calc.getRange("A11:B11").values = [["Trip / Fuel Inputs", ""]];
calc.mergeCells("A11:B11");
calc.getRange("A11:B11").format = {
  fill: { color: "#D7E3F2" },
  font: { bold: true, color: "#17324D" },
  horizontalAlignment: "center",
};
calc.getRange("A12:B14").values = [
  ["Trip Miles", 500],
  ["Vehicle MPG", 10],
  ["Fuel Price / Gallon", 3.25],
];
calc.getRange("A12:A14").format = { font: { bold: true }, fill: { color: "#F3F6FA" } };
calc.getRange("B12:B14").format = { fill: { color: "#FFF6C7" } };
calc.getRange("B12:B13").setNumberFormat("0.0");
calc.getRange("B14").setNumberFormat("$#,##0.00");

calc.getRange("D4:E12").values = [
  ["Duration Days", ""],
  ["Time Add-On Day", ""],
  ["Billable Days", ""],
  ["Discount Tier", ""],
  ["Gross Rental", ""],
  ["Discount Amount", ""],
  ["Net Rental", ""],
  ["Tax / Fees", ""],
  ["Total Due", ""],
];
calc.getRange("E4:E12").formulas = [
  ['=IF(OR($B$4="",$B$6=""),"",MAX(0,INT($B$6)-INT($B$4)))'],
  ['=IF(OR($B$4="",$B$6=""),"",IFERROR(IF(MOD($B$7,1)-MOD($B$5,1)>=$B$8/24,1,0),0))'],
  ['=IF(OR($B$4="",$B$6=""),"",IF($B$6<$B$4,"Return before pickup",MAX(1,E4+E5)))'],
  ['=IF(ISNUMBER(E6),LOOKUP(E6,\'Rate Setup\'!$A$10:$A$14,\'Rate Setup\'!$C$10:$C$14),"")'],
  ['=IF(ISNUMBER(E6),E6*\'Rate Setup\'!$B$4,"")'],
  ['=IF(E8="","",E8*E7)'],
  ['=IF(E8="","",E8-E9)'],
  ['=IF(E10="","",E10*$B$9)'],
  ['=IF(E10="","",E10+E11)'],
];
calc.getRange("D4:D12").format = { font: { bold: true }, fill: { color: "#F3F6FA" } };
calc.getRange("E4:E12").format = { fill: { color: "#EAF4EA" } };
calc.getRange("E7").setNumberFormat("0%");
calc.getRange("E8:E12").setNumberFormat("$#,##0.00");
calc.getRange("E4:E6").setNumberFormat("0");
calc.getRange("E5").setNumberFormat("0");

calc.getRange("D13:E13").values = [["Trip / Fuel Estimate", ""]];
calc.mergeCells("D13:E13");
calc.getRange("D13:E13").format = {
  fill: { color: "#D7E3F2" },
  font: { bold: true, color: "#17324D" },
  horizontalAlignment: "center",
};
calc.getRange("D14:E19").values = [
  ["Trip Miles", ""],
  ["Fuel Needed (gal)", ""],
  ["Fuel Cost", ""],
  ["Rental + Fuel", ""],
  ["Cost Per Mile", ""],
  ["Cost Per Billable Day", ""],
];
calc.getRange("E14:E19").formulas = [
  ['=IF($B$12="","",$B$12)'],
  ['=IF(OR($B$12="",$B$13="", $B$13=0),"",$B$12/$B$13)'],
  ['=IF(E15="","",E15*$B$14)'],
  ['=IF(OR(E12="",E16=""),"",E12+E16)'],
  ['=IF(OR(E17="",$B$12="", $B$12=0),"",E17/$B$12)'],
  ['=IF(OR(E17="",E6="",NOT(ISNUMBER(E6))),"",E17/E6)'],
];
calc.getRange("D14:D19").format = { font: { bold: true }, fill: { color: "#F3F6FA" } };
calc.getRange("E14:E19").format = { fill: { color: "#EAF4EA" } };
calc.getRange("E14:E15").setNumberFormat("0.0");
calc.getRange("E16:E19").setNumberFormat("$#,##0.00");

calc.getRange("A21:F21").values = [["Billing Rule Used", "", "", "", "", ""]];
calc.mergeCells("A21:F21");
calc.getRange("A21:F21").format = {
  fill: { color: "#D7E3F2" },
  font: { bold: true, color: "#17324D" },
};
calc.getRange("A22:F26").values = [
  ["The webpage states rental periods are 24 hours.", "", "", "", "", ""],
  ["If return time is at least 1 hour later than pickup time, the calculator adds 1 billable day.", "", "", "", "", ""],
  ["Rental cost is calculated as billable days times the daily rate, then the applicable day-count discount is applied.", "", "", "", "", ""],
  ["Edit Rate Setup if Bham Trailer Rentals changes the daily rate or discount tiers.", "", "", "", "", ""],
  ["Fuel cost is calculated from user-entered trip miles, vehicle MPG, and fuel price per gallon.", "", "", "", "", ""],
];
for (const row of ["A22:F22", "A23:F23", "A24:F24", "A25:F25", "A26:F26"]) {
  calc.mergeCells(row);
}
calc.getRange("A22:F26").format = {
  fill: { color: "#FFFFFF" },
  font: { color: "#333333" },
  wrapText: true,
  verticalAlignment: "top",
};

calc.getRange("A28:E28").values = [["Example Scenarios", "", "", "", ""]];
calc.mergeCells("A28:E28");
calc.getRange("A28:E28").format = {
  fill: { color: "#D7E3F2" },
  font: { bold: true, color: "#17324D" },
};
calc.getRange("A29:E34").values = [
  ["Billable Days", "Discount", "Rental Cost", "Discount Amount", "Notes"],
  [1, "", "", "", "1-5 day tier"],
  [6, "", "", "", "6 day tier"],
  [7, "", "", "", "7-13 day tier"],
  [14, "", "", "", "14-20 day tier"],
  [21, "", "", "", "21+ day tier"],
];
calc.getRange("B30:D34").formulas = [
  ['=LOOKUP(A30,\'Rate Setup\'!$A$10:$A$14,\'Rate Setup\'!$C$10:$C$14)', '=A30*\'Rate Setup\'!$B$4*(1-B30)', '=A30*\'Rate Setup\'!$B$4*B30'],
  ['=LOOKUP(A31,\'Rate Setup\'!$A$10:$A$14,\'Rate Setup\'!$C$10:$C$14)', '=A31*\'Rate Setup\'!$B$4*(1-B31)', '=A31*\'Rate Setup\'!$B$4*B31'],
  ['=LOOKUP(A32,\'Rate Setup\'!$A$10:$A$14,\'Rate Setup\'!$C$10:$C$14)', '=A32*\'Rate Setup\'!$B$4*(1-B32)', '=A32*\'Rate Setup\'!$B$4*B32'],
  ['=LOOKUP(A33,\'Rate Setup\'!$A$10:$A$14,\'Rate Setup\'!$C$10:$C$14)', '=A33*\'Rate Setup\'!$B$4*(1-B33)', '=A33*\'Rate Setup\'!$B$4*B33'],
  ['=LOOKUP(A34,\'Rate Setup\'!$A$10:$A$14,\'Rate Setup\'!$C$10:$C$14)', '=A34*\'Rate Setup\'!$B$4*(1-B34)', '=A34*\'Rate Setup\'!$B$4*B34'],
];
calc.getRange("A29:E29").format = { fill: { color: "#1F3A5F" }, font: { color: "#17324D", bold: true } };
calc.getRange("A29:E34").format.borders = { preset: "all", style: "thin", color: "#C8D0D8" };
calc.getRange("B30:B34").setNumberFormat("0%");
calc.getRange("C30:D34").setNumberFormat("$#,##0.00");

rates.getRange("A1:D1").values = [["Rate Setup", "", "", ""]];
rates.mergeCells("A1:D1");
rates.getRange("A1:D1").format = {
  fill: { color: "#1F3A5F" },
  font: { color: "#17324D", bold: true, size: 16 },
};
rates.getRange("A3:C4").values = [
  ["Rate Item", "Amount", "Source / Assumption"],
  ["Published daily rate", 150, "Webpage: $150 per 24 hours"],
];
rates.getRange("A3:C3").format = { fill: { color: "#1F3A5F" }, font: { color: "#17324D", bold: true } };
rates.getRange("A4:A4").format = { font: { bold: true }, fill: { color: "#F3F6FA" } };
rates.getRange("B4:B4").format = { fill: { color: "#FFF6C7" } };
rates.getRange("B4:B4").setNumberFormat("$#,##0.00");
rates.getRange("A3:C4").format.borders = { preset: "all", style: "thin", color: "#C8D0D8" };

rates.getRange("A9:E14").values = [
  ["Minimum Days", "Maximum Days", "Discount", "Tier Label", "Source / Assumption"],
  [1, 5, 0.05, "1-5 days", "User-provided site discount"],
  [6, 6, 0.18, "6 days", "User-provided site discount"],
  [7, 13, 0.30, "7-13 days", "User-provided site discount"],
  [14, 20, 0.35, "14-20 days", "User-provided site discount"],
  [21, "", 0.40, "21+ days", "User-provided site discount"],
];
rates.getRange("A9:E9").format = { fill: { color: "#1F3A5F" }, font: { color: "#17324D", bold: true } };
rates.getRange("A9:E14").format.borders = { preset: "all", style: "thin", color: "#C8D0D8" };
rates.getRange("C10:C14").setNumberFormat("0%");

notes.getRange("A1:D1").values = [["Source Notes", "", "", ""]];
notes.mergeCells("A1:D1");
notes.getRange("A1:D1").format = {
  fill: { color: "#1F3A5F" },
  font: { color: "#17324D", bold: true, size: 16 },
};
notes.getRange("A3:B11").values = [
  ["Source URL", "https://bhamtrailers.com/20-Enclosed-Trailer"],
  ["Trailer", "8.5' x 20' Enclosed Trailer"],
  ["Published Daily Rate", "$150 per 24 hours"],
  ["Discount Tiers", "5% for 1-5 days; 18% for 6 days; 30% for 7-13 days; 35% for 14-20 days; 40% for 21+ days."],
  ["Billing Period Note", "Rental periods are 24 hours. Return time 1 hour or more later than pickup time adds 1 day."],
  ["Rental Formula", "Billable days x daily rate x (1 - applicable discount)."],
  ["Workbook Assumption", "Discount tiers are based on the user-provided site language. Edit Rate Setup if Bham Trailer Rentals changes the tiers."],
  ["Fuel Assumption", "Trip miles, vehicle MPG, and fuel price per gallon are user-entered inputs on the Calculator tab."],
  ["Google Sheets Compatibility", "Formulas use Google Sheets-compatible functions. Upload or import this XLSX into Google Sheets to edit it there."],
];
notes.getRange("A3:A11").format = { font: { bold: true }, fill: { color: "#F3F6FA" } };
notes.getRange("A3:B11").format = { wrapText: true };
notes.getRange("A3:B11").format.borders = { preset: "all", style: "thin", color: "#C8D0D8" };

for (const sheet of [calc, rates, notes]) {
  sheet.getUsedRange().format.autofitColumns();
  sheet.getUsedRange().format.autofitRows();
}

calc.getRange("A:F").format.columnWidthPx = 150;
calc.getRange("A:A").format.columnWidthPx = 180;
calc.getRange("D:D").format.columnWidthPx = 180;
calc.getRange("E:E").format.columnWidthPx = 130;
calc.getRange("F:F").format.columnWidthPx = 120;
rates.getRange("A:A").format.columnWidthPx = 300;
rates.getRange("B:D").format.columnWidthPx = 150;
rates.getRange("C:C").format.columnWidthPx = 260;
rates.getRange("E:E").format.columnWidthPx = 240;
notes.getRange("A:A").format.columnWidthPx = 190;
notes.getRange("B:B").format.columnWidthPx = 760;
notes.getRange("A7:B11").format.rowHeightPx = 34;

calc.freezePanes.freezeRows(3);
rates.freezePanes.freezeRows(3);
notes.freezePanes.freezeRows(1);

await fs.mkdir(outputDir, { recursive: true });

const calcInspect = await workbook.inspect({
  kind: "table",
  range: "Calculator!A1:F34",
  include: "values,formulas",
  tableMaxRows: 38,
  tableMaxCols: 8,
});
console.log(calcInspect.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

for (const sheetName of ["Calculator", "Rate Setup", "Source Notes"]) {
  const blob = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  if (blob instanceof Uint8Array) {
    await fs.writeFile(`${outputDir}/${sheetName.toLowerCase().replaceAll(" ", "_")}.png`, blob);
  } else if (blob?.bytes instanceof Uint8Array) {
    await fs.writeFile(`${outputDir}/${sheetName.toLowerCase().replaceAll(" ", "_")}.png`, blob.bytes);
  } else if (typeof blob?.arrayBuffer === "function") {
    await fs.writeFile(`${outputDir}/${sheetName.toLowerCase().replaceAll(" ", "_")}.png`, Buffer.from(await blob.arrayBuffer()));
  } else {
    console.log(`rendered:${sheetName}:${typeof blob}`);
  }
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(`saved:${outputPath}`);
