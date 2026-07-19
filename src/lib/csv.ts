// Minimal RFC 4180-ish CSV parser: handles quoted fields, embedded commas,
// escaped quotes ("") inside quoted fields, and both \n and \r\n line endings.

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      pushField();
    } else if (char === "\n") {
      pushRow();
    } else if (char === "\r") {
      // Skip; the following \n (if present) triggers pushRow.
    } else {
      field += char;
    }
  }

  // Final field/row if the text doesn't end with a newline.
  if (field.length > 0 || row.length > 0) {
    pushRow();
  }

  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ""));
}
