export type LenderProgramImportRow = {
  lenderCode: string;
  displayName: string;
  legalName: string;
  lenderType: 'bank' | 'nbfc' | 'hfc' | 'fintech' | 'other';
  programCode: string;
  programName: string;
  product: string;
  minLoan: number | null;
  maxLoan: number | null;
  indicativeRoiMin: number | null;
  indicativeRoiMax: number | null;
  loginSlaHours: number;
  sanctionSlaHours: number;
  disbursalSlaHours: number;
};

export type ImportValidation = {
  rows: LenderProgramImportRow[];
  errors: Array<{ row: number; field: string; message: string }>;
};

const lenderTypes = new Set(['bank', 'nbfc', 'hfc', 'fintech', 'other']);

function text(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function nullableNumber(value: unknown) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function positiveInteger(value: unknown, fallback: number) {
  if (value === '' || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : Number.NaN;
}

export function validateLenderProgramImport(input: unknown): ImportValidation {
  if (!Array.isArray(input)) {
    return {
      rows: [],
      errors: [{ row: 0, field: 'rows', message: 'Import must be a JSON array' }],
    };
  }
  if (!input.length)
    return {
      rows: [],
      errors: [{ row: 0, field: 'rows', message: 'At least one row is required' }],
    };
  if (input.length > 500)
    return {
      rows: [],
      errors: [{ row: 0, field: 'rows', message: 'Maximum 500 rows per import' }],
    };

  const rows: LenderProgramImportRow[] = [];
  const errors: ImportValidation['errors'] = [];
  const seenPrograms = new Set<string>();
  input.forEach((raw, index) => {
    const source =
      raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
    const rowNumber = index + 1;
    const lenderCode = text(source.lenderCode).toUpperCase();
    const displayName = text(source.displayName);
    const legalName = text(source.legalName) || displayName;
    const lenderType = text(source.lenderType).toLowerCase();
    const programCode = text(source.programCode).toUpperCase();
    const programName = text(source.programName);
    const product = text(source.product).toLowerCase();
    const minLoan = nullableNumber(source.minLoan);
    const maxLoan = nullableNumber(source.maxLoan);
    const indicativeRoiMin = nullableNumber(source.indicativeRoiMin);
    const indicativeRoiMax = nullableNumber(source.indicativeRoiMax);
    const loginSlaHours = positiveInteger(source.loginSlaHours, 24);
    const sanctionSlaHours = positiveInteger(source.sanctionSlaHours, 120);
    const disbursalSlaHours = positiveInteger(source.disbursalSlaHours, 72);

    if (!lenderCode)
      errors.push({ row: rowNumber, field: 'lenderCode', message: 'Lender code is required' });
    if (!displayName)
      errors.push({ row: rowNumber, field: 'displayName', message: 'Display name is required' });
    if (!lenderTypes.has(lenderType))
      errors.push({
        row: rowNumber,
        field: 'lenderType',
        message: 'Use bank, nbfc, hfc, fintech, or other',
      });
    if (!programCode)
      errors.push({ row: rowNumber, field: 'programCode', message: 'Program code is required' });
    if (!programName)
      errors.push({ row: rowNumber, field: 'programName', message: 'Program name is required' });
    if (!product) errors.push({ row: rowNumber, field: 'product', message: 'Product is required' });
    for (const [field, value] of Object.entries({
      minLoan,
      maxLoan,
      indicativeRoiMin,
      indicativeRoiMax,
    })) {
      if (value !== null && (!Number.isFinite(value) || value < 0))
        errors.push({ row: rowNumber, field, message: 'Must be a non-negative number' });
    }
    if (
      minLoan !== null &&
      maxLoan !== null &&
      Number.isFinite(minLoan) &&
      Number.isFinite(maxLoan) &&
      minLoan > maxLoan
    ) {
      errors.push({
        row: rowNumber,
        field: 'maxLoan',
        message: 'Maximum loan must be at least minimum loan',
      });
    }
    if (
      indicativeRoiMin !== null &&
      indicativeRoiMax !== null &&
      Number.isFinite(indicativeRoiMin) &&
      Number.isFinite(indicativeRoiMax) &&
      indicativeRoiMin > indicativeRoiMax
    ) {
      errors.push({
        row: rowNumber,
        field: 'indicativeRoiMax',
        message: 'Maximum ROI must be at least minimum ROI',
      });
    }
    for (const [field, value] of Object.entries({
      loginSlaHours,
      sanctionSlaHours,
      disbursalSlaHours,
    })) {
      if (!Number.isFinite(value))
        errors.push({ row: rowNumber, field, message: 'Must be a positive whole number' });
    }
    const duplicateKey = programCode.toLowerCase();
    if (programCode && seenPrograms.has(duplicateKey))
      errors.push({
        row: rowNumber,
        field: 'programCode',
        message: 'Duplicate program code in this batch',
      });
    seenPrograms.add(duplicateKey);

    rows.push({
      lenderCode,
      displayName,
      legalName,
      lenderType: lenderType as LenderProgramImportRow['lenderType'],
      programCode,
      programName,
      product,
      minLoan,
      maxLoan,
      indicativeRoiMin,
      indicativeRoiMax,
      loginSlaHours,
      sanctionSlaHours,
      disbursalSlaHours,
    });
  });
  return { rows, errors };
}
