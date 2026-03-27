export function exportToCsv<T>(
  data: T[],
  columns: { key: keyof T; label: string }[],
  filename: string,
): void {
  const BOM = '\uFEFF';
  const header = columns.map((c) => c.label).join(';');
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val = row[c.key];
        const str = val === null || val === undefined ? '' : String(val);
        // Sanitize CSV formula injection
        const FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];
        const sanitized = FORMULA_PREFIXES.some((p) => str.startsWith(p))
          ? `'${str}`
          : str;
        // Escape quotes and wrap in quotes if contains delimiter or quotes
        if (sanitized.includes(';') || sanitized.includes('"') || sanitized.includes('\n')) {
          return `"${sanitized.replace(/"/g, '""')}"`;
        }
        return sanitized;
      })
      .join(';'),
  );

  const csv = BOM + [header, ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
