export type BureauReportInput = {
  rawJson: unknown;
  reportId?: string | null;
  fallbackName?: string | null;
  createdAt?: string | null;
  providerLogoDataUrl?: string | null;
};

type AnyRecord = Record<string, any>;

const ID_TYPES: Record<string, string> = {
  '01': 'INCOME TAX ID NUMBER (PAN)',
  '02': 'PASSPORT NUMBER',
  '03': 'VOTER ID',
  '04': 'DRIVING LICENSE',
  '05': 'RATION CARD',
  '06': 'UNIVERSAL ID NUMBER (UID)',
  '07': 'ADDITIONAL ID',
  '08': 'CKYC',
};

const PHONE_TYPES: Record<string, string> = {
  '00': 'NOT CLASSIFIED',
  '01': 'MOBILE PHONE',
  '02': 'HOME PHONE',
  '03': 'OFFICE PHONE',
  '04': 'NOT CLASSIFIED',
};

const ADDRESS_TYPES: Record<string, string> = {
  '01': 'PERMANENT ADDRESS',
  '02': 'RESIDENCE ADDRESS',
  '03': 'OFFICE ADDRESS',
  '04': 'NOT CATEGORIZED',
};

const ACCOUNT_TYPES: Record<string, string> = {
  '00': 'OTHER',
  '01': 'AUTO LOAN',
  '02': 'HOUSING LOAN',
  '03': 'PROPERTY LOAN',
  '04': 'LOAN AGAINST SHARES/SECURITIES',
  '05': 'PERSONAL LOAN',
  '06': 'CONSUMER LOAN',
  '07': 'GOLD LOAN',
  '08': 'EDUCATION LOAN',
  '10': 'CREDIT CARD',
  '13': 'TWO-WHEELER LOAN',
  '17': 'COMMERCIAL VEHICLE LOAN',
  '32': 'BUSINESS LOAN - GENERAL',
  '50': 'BUSINESS LOAN - SECURED',
  '51': 'BUSINESS LOAN - UNSECURED',
};

const OWNERSHIP: Record<string, string> = {
  '1': 'INDIVIDUAL',
  '2': 'AUTHORIZED USER',
  '3': 'GUARANTOR',
  '4': 'JOINT',
};

const PAYMENT_FREQUENCY: Record<string, string> = {
  '01': 'Weekly',
  '02': 'Fortnightly',
  '03': 'Monthly',
  '04': 'Quarterly',
};

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as AnyRecord : {};
}

function asArray(value: unknown): AnyRecord[] {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') as AnyRecord[] : [];
}

function unwrapBody(rawJson: unknown): AnyRecord {
  const raw = asRecord(rawJson);
  const candidates = [
    raw.body,
    raw.raw?.body,
    raw.response?.body,
    raw.response?.raw?.body,
    raw.raw_json?.body,
    raw.raw_json?.response?.body,
    raw.data?.raw?.body,
    raw.data?.body,
    raw,
  ];
  return asRecord(candidates.find((item) => asRecord(item).consumerCreditData));
}

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function clean(value: unknown, fallback = ''): string {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function fmtDate(value: unknown): string {
  const raw = clean(value);
  if (!raw) return '';
  if (/^\d{8}$/.test(raw)) return `${raw.slice(0, 2)}-${raw.slice(2, 4)}-${raw.slice(4)}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw.slice(8)}-${raw.slice(5, 7)}-${raw.slice(0, 4)}`;
  return raw;
}

function fmtMoney(value: unknown): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return clean(value, 'Not Available');
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(num);
}

function compactAddress(address: AnyRecord): string {
  return [address.line1, address.line2, address.line3, address.line4, address.line5, address.state, address.pinCode]
    .map((part) => clean(part))
    .filter(Boolean)
    .join(' , ');
}

function paymentHistoryChunks(history: unknown, startDate?: unknown): string[] {
  const text = clean(history);
  if (!text) return [];
  const chunks = text.match(/.{1,3}/g) ?? [];
  const start = clean(startDate);
  return chunks.slice(0, 36).map((chunk, index) => {
    if (!/^\d{8}$/.test(start)) return chunk;
    const month = Number(start.slice(2, 4)) - 1 - index;
    const year = Number(start.slice(4));
    const date = new Date(year, month, 1);
    return `${chunk}<br>${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getFullYear()).slice(2)}`;
  });
}

function row(cells: string[], className = '') {
  return `<tr class="${className}">${cells.map((cell) => `<td>${cell}</td>`).join('')}</tr>`;
}

function infoLine(label: string, value: unknown) {
  return `<span class="muted">${esc(label)}:</span><b>${esc(clean(value, 'NOT DISCLOSED'))}</b>`;
}

export function generateBureauReportHtml(input: BureauReportInput): string {
  const body = unwrapBody(input.rawJson);
  const credit = asArray(body.consumerCreditData)[0] ?? {};
  const summary = asRecord(body.consumerSummaryData);
  const name = asArray(credit.names)[0] ?? {};
  const score = asArray(credit.scores)[0] ?? {};
  const accountSummary = asRecord(summary.accountSummary);
  const inquirySummary = asRecord(summary.inquirySummary);
  const reportId = clean(input.reportId)
    || clean(asRecord(input.rawJson).data?.reportId)
    || clean(asRecord(input.rawJson).reportId)
    || `RPT-${Date.now()}`;
  const customerName = clean(name.name, clean(input.fallbackName, 'NOT DISCLOSED'));
  const processedDate = fmtDate(credit.tuefHeader?.dateProcessed) || fmtDate(input.createdAt) || fmtDate(new Date().toISOString().slice(0, 10));
  const processedTime = clean(credit.tuefHeader?.timeProcessed).replace(/^(\d{2})(\d{2})(\d{2})$/, '$1:$2:$3');
  const ids = asArray(credit.ids);
  const phones = asArray(credit.telephones);
  const emails = asArray(credit.emails);
  const addresses = asArray(credit.addresses);
  const employment = asArray(credit.employment)[0] ?? {};
  const accounts = asArray(credit.accounts);
  const enquiries = asArray(credit.enquiries);

  const idsHtml = ids.map((id, idx) => row([
    `<b>${esc(ID_TYPES[clean(id.idType)] ?? clean(id.idType, 'ID'))}</b>`,
    `<b>${esc(clean(id.idNumber, 'NOT DISCLOSED'))}</b>`,
    '',
    '',
  ], idx % 2 ? '' : 'shade')).join('');

  const phoneHtml = phones.map((phone, idx) => row([
    `<b>${esc(PHONE_TYPES[clean(phone.telephoneType)] ?? 'NOT CLASSIFIED')}</b>`,
    `<b>${esc(clean(phone.telephoneNumber, 'NOT DISCLOSED'))}</b>`,
    '',
  ], idx % 2 ? '' : 'shade')).join('');

  const emailHtml = emails.map((email, idx) => row([
    `<b>${esc(clean(email.emailID, 'NOT DISCLOSED'))}</b>`,
  ], idx % 2 ? '' : 'shade')).join('');

  const addressHtml = addresses.map((address, idx) => `
    <tr class="${idx % 2 ? '' : 'shade'}">
      <td colspan="4"><span class="blue">ADDRESS :</span> <b>${esc(compactAddress(address) || 'NOT DISCLOSED')}</b></td>
    </tr>
    <tr class="${idx % 2 ? '' : 'shade'}">
      <td><span class="blue">CATEGORY:</span> <b>${esc(ADDRESS_TYPES[clean(address.addressCategory)] ?? 'NOT CATEGORIZED')}</b></td>
      <td><span class="blue">RESIDENCE CODE:</span><b>NA</b></td>
      <td><span class="blue">DATE REPORTED:</span> <b>${esc(fmtDate(address.dateReported))}</b></td>
    </tr>
  `).join('');

  const accountsHtml = accounts.map((account, idx) => {
    const history = paymentHistoryChunks(account.paymentHistory, account.paymentStartDate);
    return `
      <tr class="${idx % 2 ? '' : 'shade'} section-gap"><td colspan="4"></td></tr>
      <tr class="${idx % 2 ? '' : 'shade'} account-row">
        <td>
          ${infoLine('MEMBER NAME', account.memberShortName)}<br>
          ${infoLine('ACCOUNT NUMBER', account.accountNumber)}<br>
          ${infoLine('TYPE', ACCOUNT_TYPES[clean(account.accountType)] ?? account.accountType)}<br>
          ${infoLine('OWNERSHIP', OWNERSHIP[String(account.ownershipIndicator)] ?? account.ownershipIndicator)}
        </td>
        <td>
          ${infoLine('OPENED', fmtDate(account.dateOpened))}<br>
          ${infoLine('LAST PAYMENT', fmtDate(account.lastPaymentDate))}<br>
          ${infoLine('REPORTED AND CERTIFIED', fmtDate(account.dateReported))}<br>
          ${infoLine('PMT HIST START', fmtDate(account.paymentStartDate))}<br>
          ${infoLine('PMT HIST END', fmtDate(account.paymentEndDate))}
        </td>
        <td>
          ${infoLine('SANCTIONED', fmtMoney(account.highCreditAmount ?? account.creditLimit))}<br>
          ${infoLine('CURRENT BALANCE', fmtMoney(account.currentBalance))}<br>
          ${infoLine('OVERDUE', fmtMoney(account.amountOverdue))}<br>
          ${infoLine('PMT FREQ', PAYMENT_FREQUENCY[clean(account.paymentFrequency)] ?? account.paymentFrequency)}
        </td>
        <td>${esc(clean(account.suitFiledStatus))}</td>
      </tr>
      ${history.length ? `<tr class="${idx % 2 ? '' : 'shade'}"><td colspan="4" class="history-title">DAYS PAST DUE/ASSET CLASSIFICATION (UP TO 36 MONTHS; LEFT TO RIGHT)</td></tr><tr class="${idx % 2 ? '' : 'shade'}"><td colspan="4" class="history">${history.map((item) => `<span>${item}</span>`).join('')}</td></tr>` : ''}
    `;
  }).join('');

  const enquiriesHtml = enquiries.map((enquiry, idx) => row([
    `<b>${esc(clean(enquiry.memberShortName, 'NOT DISCLOSED'))}</b>`,
    `<b>${esc(fmtDate(enquiry.enquiryDate))}</b>`,
    `<b>${esc(ACCOUNT_TYPES[clean(enquiry.enquiryPurpose)] ?? clean(enquiry.enquiryPurpose, 'NOT DISCLOSED'))}</b>`,
    `<b>${esc(fmtMoney(enquiry.enquiryAmount))}</b>`,
  ], idx % 2 ? '' : 'shade')).join('');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Bureau Report ${esc(reportId)}</title>
<style>
  *{box-sizing:border-box} body{margin:0;background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:600}
  .page{width:1000px;margin:0 auto;padding:0}
  .top-space{height:65px}
  .provider-brand{height:85px;display:flex;align-items:center;padding-top:10px}
  .provider-brand img{display:block;width:300px;height:65px;object-fit:contain;object-position:left center}
  .yellow{height:30px;background:#ffdd00;font-size:18px;font-weight:500;padding:5px}
  .header{border-bottom:2px solid #00a6d6;padding:7px 0 10px;display:grid;grid-template-columns:1fr 360px;gap:20px}
  .blue{color:#00a3d7;font-weight:700}.muted{color:#777;font-style:italic;font-weight:700;margin-right:2px}
  .title{font-size:16px;color:#666;margin:14px 0 8px;font-weight:800}.line{border-bottom:1px solid #777}
  table{width:100%;border-collapse:collapse}td,th{padding:5px;vertical-align:top}th{text-align:left;color:#00a3d7;font-weight:800}
  .shade{background:#ededed}.score{font-size:28px;color:#0076a3;font-weight:400;text-align:center}
  .range{background:#ededed;padding:8px;margin:12px 0}.red{color:#ff1f1f}.section-gap td{height:8px}
  .account-row td{width:25%;line-height:1.75}.history-title{color:#00a3d7;font-weight:800;padding-top:14px}
  .history{display:flex;flex-wrap:wrap;gap:18px 31px;padding:12px 12px 18px}.history span{min-width:28px;line-height:1.2}
  .end{border-top:1px solid #777;border-bottom:2px solid #00a6d6;color:#00a3d7;padding:18px 5px;margin-top:10px;font-weight:800}
  @page{size:letter;margin:0.18in 0.25in} @media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}.page{width:100%}}
</style>
</head>
<body>
<div class="page">
  ${input.providerLogoDataUrl
    ? `<div class="provider-brand"><img src="${esc(input.providerLogoDataUrl)}" alt="TransUnion CIBIL"></div>`
    : '<div class="top-space"></div>'}
  <div class="yellow">CONSUMER CIR</div>
  <div class="header">
    <div><span class="blue">CONSUMER:</span> <b>${esc(customerName)}</b><br><span class="blue">REPORT ID:</span> <b>${esc(reportId)}</b></div>
    <div><span class="blue">DATE:</span> <b>${esc(processedDate)}</b><br><span class="blue">TIME:</span> <b>${esc(processedTime)}</b></div>
  </div>

  <div class="title">CONSUMER INFORMATION:</div>
  <table class="line"><tr><td>${infoLine('NAME', customerName)}<br>${infoLine('DATE OF BIRTH', fmtDate(name.birthDate))}</td><td></td></tr></table>

  <div class="title">CIBIL TRANSUNION SCORE(S):</div>
  <table><tr><th>SCORE NAME</th><th>SCORE</th><th>SCORING FACTORS</th></tr><tr class="shade"><td>${esc(clean(score.scoreName))}</td><td class="score">${esc(clean(score.score || asRecord(input.rawJson).data?.score))}</td><td>${asArray(score.reasonCodes).map((r) => esc(clean(r.reasonCodeValue))).join('<br>')}</td></tr></table>
  <div class="range"><span class="blue">POSSIBLE RANGE FOR</span><br><br>
    Consumers with more than 6 months credit history* <span class="red">: 300 (high risk) to 900 (low risk)</span><br>
    Consumers having less than 6 months credit history* <span class="red">: ""</span><br>
    Consumers not in CIBIL database or with insufficient information for scoring* <span class="red">: -1</span><br><br>
    * At least one tradeline with information updated in last 24 months is required.In case of error in scoring a value of '0' is returned.
  </div>

  <div class="title">IDENTIFICATION(S):</div>
  <table class="line"><tr><th>IDENTIFICATION TYPE</th><th>IDENTIFICATION NUMBER</th><th>ISSUE DATE</th><th>EXPIRATION DATE</th></tr>${idsHtml}</table>
  <div class="title">TELEPHONE(S):</div>
  <table class="line"><tr><th>TELEPHONE TYPE</th><th>TELEPHONE NUMBER</th><th>TELEPHONE EXTENSION</th></tr>${phoneHtml}</table>
  <div class="title">EMAIL CONTACT(S):</div>
  <table class="line"><tr><th>EMAIL ADDRESS</th></tr>${emailHtml}</table>
  <div class="title">ADDRESS(ES):</div>
  <table class="line">${addressHtml}</table>
  <div class="title">EMPLOYMENT INFORMATION:</div>
  <table class="line"><tr><th>ACCOUNT TYPE</th><th>DATE REPORTED</th><th>OCCUPATION CODE</th><th>INCOME</th><th>NET / GROSS INCOME INDICATOR</th><th>MONTHLY / ANNUAL INCOME INDICATOR</th></tr>
    <tr class="shade"><td>${esc(ACCOUNT_TYPES[clean(employment.accountType)] ?? clean(employment.accountType, 'CONSUMER LOAN'))}</td><td>${esc(fmtDate(employment.dateReported))}</td><td>${esc(clean(employment.occupationCode))}</td><td>${esc(clean(employment.income, 'Not Available'))}</td><td>Not Available</td><td>Not Available</td></tr></table>

  <div class="title">SUMMARY:</div>
  <table class="line"><tr><th>ACCOUNT TYPE</th><th>ACCOUNTS</th><th>ADVANCES</th><th>BALANCES</th><th>DATE OPENED</th></tr>
    <tr class="shade"><td>All Accounts</td><td><span class="muted">TOTAL:</span>${esc(clean(accountSummary.totalAccounts, '0'))}<br><span class="muted">OVERDUE:</span>${esc(clean(accountSummary.overdueAccounts, '0'))}<br><span class="muted">ZERO-BALANCE:</span>${esc(clean(accountSummary.zeroBalanceAccounts, '0'))}</td><td><span class="muted">HIGH CR/SANC. AMT:</span>${esc(fmtMoney(accountSummary.highCreditAmount))}</td><td><span class="muted">CURRENT:</span>${esc(fmtMoney(accountSummary.currentBalance))}<br><span class="muted">OVERDUE:</span>${esc(fmtMoney(accountSummary.overdueBalance))}</td><td><span class="muted">RECENT:</span>${esc(fmtDate(accountSummary.recentDateOpened))}<br><span class="muted">OLDEST:</span>${esc(fmtDate(accountSummary.oldestDateOpened))}</td></tr>
  </table>
  <div class="title blue">ENQUIRIES</div>
  <table class="line"><tr><th>ENQUIRY PURPOSE</th><th>TOTAL</th><th>PAST 30 DAYS</th><th>PAST 12 MONTHS</th><th>PAST 24 MONTHS</th><th>RECENT</th></tr>
    <tr class="shade"><td>All Enquiries</td><td>${esc(clean(inquirySummary.totalInquiry, '0'))}</td><td>${esc(clean(inquirySummary.inquiryPast30Days, '0'))}</td><td>${esc(clean(inquirySummary.inquiryPast12Months, '0'))}</td><td>${esc(clean(inquirySummary.inquiryPast24Months, '0'))}</td><td>${esc(fmtDate(inquirySummary.recentInquiryDate))}</td></tr>
  </table>

  <div class="title">ACCOUNT(S):</div>
  <table class="line"><tr><th>ACCOUNT</th><th>DATES</th><th>AMOUNTS</th><th>STATUS</th></tr>${accountsHtml}</table>
  <div class="title">ENQUIRIES:</div>
  <table class="line"><tr><th>MEMBER NAME</th><th>DATE OF ENQUIRY</th><th>ENQUIRY PURPOSE</th><th>ENQUIRY AMOUNT</th></tr>${enquiriesHtml}</table>
  <div class="end">END OF REPORT ON ${esc(customerName)}</div>
</div>
</body>
</html>`;
}
