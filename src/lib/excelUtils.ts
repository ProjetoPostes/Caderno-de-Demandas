import ExcelJS from "exceljs";

/**
 * Export data to Excel file
 * Uses exceljs library (secure alternative to xlsx)
 */
export async function exportToExcel(
  data: Record<string, unknown>[],
  sheetName: string,
  fileName: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  if (data.length === 0) {
    throw new Error("Nenhum dado para exportar");
  }

  // Add headers from first row keys
  const headers = Object.keys(data[0]);
  worksheet.addRow(headers);

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  // Add data rows
  data.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header];
      // Convert values to appropriate types
      if (value === null || value === undefined) return "";
      if (typeof value === "number") return value;
      return String(value);
    });
    worksheet.addRow(values);
  });

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    let maxLength = 10;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const cellLength = cell.value ? String(cell.value).length : 10;
      if (cellLength > maxLength) {
        maxLength = Math.min(cellLength, 50); // Cap at 50 chars
      }
    });
    column.width = maxLength + 2;
  });

  // Generate and download file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Read Excel file and return data as array of objects
 * Uses exceljs library (secure alternative to xlsx)
 */
export async function readExcelFile(
  file: File
): Promise<Record<string, unknown>[]> {
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("Arquivo Excel vazio ou inválido");
  }

  const data: Record<string, unknown>[] = [];
  const headers: string[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      // First row is headers
      row.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = String(cell.value || `Column${colNumber}`);
      });
    } else {
      // Data rows
      const rowData: Record<string, unknown> = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          // Handle different cell types
          let value = cell.value;
          if (cell.type === ExcelJS.ValueType.Date && value instanceof Date) {
            // Format date as string
            value = value.toISOString().split("T")[0];
          } else if (cell.type === ExcelJS.ValueType.RichText && typeof value === "object") {
            // Extract text from rich text
            const richText = value as { richText?: Array<{ text: string }> };
            value = richText.richText?.map((t) => t.text).join("") || "";
          }
          rowData[header] = value;
        }
      });
      
      // Only add rows that have at least one non-empty value
      if (Object.values(rowData).some((v) => v !== null && v !== undefined && v !== "")) {
        data.push(rowData);
      }
    }
  });

  return data;
}
