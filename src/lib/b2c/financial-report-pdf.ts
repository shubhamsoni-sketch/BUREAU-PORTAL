import { renderHtmlPdf } from '@/lib/bureau/report-pdf';

type Json = Record<string, unknown>;

export type FinancialReportPdfInput = {
  rawJson: unknown;
  reportId: string;
  fallbackName?: string | null;
  createdAt?: string | null;
};

const accountLabels: Record<string, string> = {
  '01': 'Auto Loan',
  '02': 'Housing Loan',
  '05': 'Personal Loan',
  '06': 'Credit Card',
  '10': 'Overdraft',
  '13': 'Consumer Loan',
  '17': 'Business Loan',
  '19': 'Property Loan',
  '31': 'Gold Loan',
  '35': 'Loan Against Property',
  '40': 'Education Loan',
};

function object(value: unknown): Json {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Json : {};
}

function list(value: unknown): Json[] {
  return Array.isArray(value) ? value.map(object) : [];
}

function text(value: unknown, fallback = 'Not available') {
  const result = String(value ?? '').trim();
  return result && result !== 'undefined' && result !== 'null' ? result : fallback;
}

function number(value: unknown) {
  const parsed = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function rupees(value: unknown) {
  const amount = number(value);
  return amount ? `Rs. ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)}` : 'Rs. 0';
}

function date(value: unknown) {
  const source = text(value, '');
  if (!source) return 'Not available';
  if (/^\d{8}$/.test(source)) return `${source.slice(0, 2)}/${source.slice(2, 4)}/${source.slice(4)}`;
  const parsed = new Date(source);
  return Number.isNaN(parsed.getTime()) ? source : parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function html(value: unknown) {
  return text(value, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function findBureauBody(raw: unknown): Json {
  const queue: unknown[] = [raw];
  const seen = new Set<unknown>();
  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== 'object' || seen.has(current)) continue;
    seen.add(current);
    const value = object(current);
    if (Array.isArray(value.consumerCreditData) || object(value.consumerSummaryData).accountSummary) return value;
    for (const child of Object.values(value)) {
      if (child && typeof child === 'object') queue.push(child);
    }
  }
  return object(raw);
}

function hasNoHit(raw: unknown) {
  const queue: unknown[] = [raw];
  const seen = new Set<unknown>();
  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== 'object' || seen.has(current)) continue;
    seen.add(current);
    const value = object(current);
    if (text(value.status, '').toLowerCase() === 'no_hit') return true;
    for (const child of Object.values(value)) if (child && typeof child === 'object') queue.push(child);
  }
  return false;
}

function page(title: string, subtitle: string, content: string, number: number) {
  return `<section class="page"><header><div class="brand">CREDIT<span>TRUST</span></div><div class="page-title">${title}</div><div class="page-number">${number} / 5</div></header><main>${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}${content}</main><footer>Prepared by CreditTrust from the available credit bureau response. This report is informational and is not lending advice.</footer></section>`;
}

function cards(items: Array<{ label: string; value: string; tone?: string }>) {
  return `<div class="cards">${items.map((item) => `<div class="card ${item.tone || ''}"><div>${item.label}</div><strong>${item.value}</strong></div>`).join('')}</div>`;
}

function table(headers: string[], rows: string[][]) {
  return `<table><thead><tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

export function generateFinancialAnalysisHtml(input: FinancialReportPdfInput) {
  const body = findBureauBody(input.rawJson);
  const credit = list(body.consumerCreditData)[0] || {};
  const summary = object(body.consumerSummaryData);
  const accountSummary = object(summary.accountSummary);
  const inquirySummary = object(summary.inquirySummary);
  const name = list(credit.names)[0] || {};
  const scoreRecord = list(credit.scores)[0] || {};
  const accounts = list(credit.accounts);
  const enquiries = list(credit.enquiries);
  const addresses = list(credit.addresses);
  const score = number(scoreRecord.score);
  const totalAccounts = number(accountSummary.totalAccounts) || accounts.length;
  const overdueAccounts = number(accountSummary.overdueAccounts) || accounts.filter((account) => number(account.amountOverdue) > 0).length;
  const outstanding = number(accountSummary.currentBalance) || accounts.reduce((total, account) => total + number(account.currentBalance), 0);
  const highCredit = number(accountSummary.highCreditAmount) || accounts.reduce((total, account) => total + number(account.highCreditAmount), 0);
  const overdueBalance = number(accountSummary.overdueBalance) || accounts.reduce((total, account) => total + number(account.amountOverdue), 0);
  const limit = accounts.reduce((total, account) => total + number(account.creditLimit), 0);
  const utilization = limit > 0 ? Math.round((outstanding / limit) * 100) : 0;
  const noHit = hasNoHit(input.rawJson) || (!accounts.length && !score);
  const fullName = text(name.name, input.fallbackName || 'CreditTrust customer');
  const address = addresses[0] || {};
  const currentDate = input.createdAt ? date(input.createdAt) : date(new Date().toISOString());
  const paymentSignals = accounts.map((account) => text(account.paymentHistory, '')).join('').replace(/X/g, '');
  const delayedMarkers = (paymentSignals.match(/[1-9]/g) || []).length;
  const scoreBand = score >= 750 ? 'Strong' : score >= 700 ? 'Healthy' : score >= 650 ? 'Developing' : score ? 'Needs attention' : 'Limited history';
  const priority = overdueBalance > 0 ? 'Resolve overdue balances first.' : utilization > 40 ? 'Reduce revolving utilisation before a new application.' : number(inquirySummary.inquiryPast30Days) > 2 ? 'Pause fresh credit applications briefly.' : 'Maintain timely payments and current balances.';
  const activeAccounts = accounts.filter((account) => number(account.currentBalance) > 0).length;
  const profileAddress = [address.line1, address.line2, address.line3, address.pinCode].filter(Boolean).map(html).join(', ') || 'Address not available in the response';

  const cover = `<div class="cover"><div class="eyebrow">PERSONAL FINANCIAL ANALYSIS</div><h1>Your financial position,<br><em>made clear.</em></h1><p>This report turns the available credit-bureau response into a practical view of credit exposure, repayment signals, and next financial actions.</p>${cards([{ label: 'Credit score', value: score ? String(score) : 'Not available', tone: score >= 700 ? 'positive' : '' }, { label: 'Financial standing', value: scoreBand }, { label: 'Report reference', value: html(input.reportId) }])}<div class="profile-strip"><div><b>${html(fullName)}</b><span>Report generated ${html(currentDate)}</span></div><div class="confidential">PRIVATE & CONFIDENTIAL</div></div></div>`;

  const snapshot = `${cards([{ label: 'Total accounts', value: String(totalAccounts) }, { label: 'Active exposure', value: String(activeAccounts) }, { label: 'Total outstanding', value: rupees(outstanding) }, { label: 'Overdue balance', value: rupees(overdueBalance), tone: overdueBalance ? 'negative' : 'positive' }])}<div class="split"><article><h2>Profile snapshot</h2>${table(['Field', 'Available information'], [['Name', html(fullName)], ['Date of birth', html(date(name.birthDate))], ['Primary address', profileAddress], ['Credit history start', html(date(accountSummary.oldestDateOpened))]])}</article><article><h2>What this means</h2><p>${noHit ? 'A credit record was not available in the source response at the time of this request. This may happen when there is limited or no reported bureau history. The report does not infer a credit score where none was returned.' : `The profile has ${totalAccounts} reported account${totalAccounts === 1 ? '' : 's'} with ${rupees(outstanding)} in reported current balances. ${overdueBalance ? `Reported overdue exposure is ${rupees(overdueBalance)} and deserves immediate attention.` : 'No overdue balance was reported in the returned summary.'}`}</p><div class="callout"><b>Current priority</b><br>${priority}</div></article></div>`;

  const portfolio = `${cards([{ label: 'Reported high credit', value: rupees(highCredit) }, { label: 'Credit limit reported', value: rupees(limit) }, { label: 'Utilisation estimate', value: limit ? `${utilization}%` : 'Not available', tone: utilization > 50 ? 'negative' : utilization ? 'positive' : '' }, { label: 'Repayment markers', value: delayedMarkers ? `${delayedMarkers} observed` : 'No delay marker observed', tone: delayedMarkers ? 'negative' : 'positive' }])}<h2>Account portfolio</h2>${accounts.length ? table(['Account type', 'Institution', 'Opened', 'Current balance', 'Overdue'], accounts.slice(0, 12).map((account) => [html(accountLabels[text(account.accountType, '')] || `Credit account (${text(account.accountType, 'other')})`), html(text(account.memberShortName, 'Not disclosed')), html(date(account.dateOpened)), rupees(account.currentBalance), rupees(account.amountOverdue)])) : '<div class="empty">No account-level credit history was included in this response.</div>'}<p class="note">Account-level figures are reproduced from the available source response. Lender names can be withheld by the source provider.</p>`;

  const riskSignals: string[] = [];
  if (overdueAccounts) riskSignals.push(`${overdueAccounts} account${overdueAccounts === 1 ? '' : 's'} has reported overdue exposure.`);
  if (utilization > 50) riskSignals.push(`Estimated utilisation is ${utilization}%, which may indicate higher reliance on revolving credit.`);
  if (number(inquirySummary.inquiryPast30Days) > 2) riskSignals.push(`${number(inquirySummary.inquiryPast30Days)} credit enquiries are recorded in the last 30 days.`);
  if (delayedMarkers) riskSignals.push('The available repayment string contains delay markers; review the relevant account entries before applying for fresh credit.');
  if (!riskSignals.length) riskSignals.push('No material risk signal was identified from the limited indicators returned in this response. Review account-level data before any lending decision.');
  const behavior = `<div class="split"><article><h2>Credit-seeking activity</h2>${cards([{ label: 'Total enquiries', value: String(number(inquirySummary.totalInquiry) || enquiries.length) }, { label: 'Past 30 days', value: String(number(inquirySummary.inquiryPast30Days)) }, { label: 'Past 12 months', value: String(number(inquirySummary.inquiryPast12Months)) }, { label: 'Latest enquiry', value: date(inquirySummary.recentInquiryDate) }])}<h3>Recent enquiry detail</h3>${enquiries.length ? table(['Date', 'Purpose', 'Amount'], enquiries.slice(0, 6).map((entry) => [html(date(entry.enquiryDate)), html(text(entry.enquiryPurpose, 'Not disclosed')), rupees(entry.enquiryAmount)])) : '<div class="empty">No enquiry-level entries were returned.</div>'}</article><article><h2>Risk & repayment signals</h2><ul class="signals">${riskSignals.map((signal) => `<li>${html(signal)}</li>`).join('')}</ul><div class="callout"><b>Important</b><br>CreditTrust does not make a lending decision or predict loan approval. Lenders apply their own policy, income, document, and verification checks.</div></article></div>`;

  const actions = [
    overdueBalance > 0 ? ['Now', 'Clear reported overdue balances and obtain closure confirmation from the lender.'] : ['Now', 'Keep all current repayments on schedule and avoid missed due dates.'],
    utilization > 30 ? ['Next 30 days', 'Reduce revolving or card balances where practical; retain payment proof for your own records.'] : ['Next 30 days', 'Maintain conservative use of existing credit and monitor each repayment date.'],
    number(inquirySummary.inquiryPast30Days) > 2 ? ['Next 60 days', 'Avoid multiple fresh credit applications in a short period unless essential.'] : ['Next 60 days', 'Apply for new credit only after comparing need, affordability, and lender terms.'],
    ['Ongoing', 'Review this report periodically and dispute only factual inaccuracies directly with the appropriate bureau or lender.'],
  ];
  const actionPlan = `<h2>Your action plan</h2><div class="timeline">${actions.map(([when, action], index) => `<div class="timeline-row"><b>${index + 1}</b><div><span>${when}</span><p>${action}</p></div></div>`).join('')}</div><div class="split"><article><h2>Financial planning checklist</h2><ul class="checklist"><li>Keep EMIs and card payments funded before due dates.</li><li>Review monthly obligations against stable income.</li><li>Keep utilisation moderate when a new loan is planned.</li><li>Store lender closure and repayment confirmations.</li></ul></article><article><h2>Report notes</h2><p>This analysis is created from the response available on ${html(currentDate)}. It may not contain every financial account, income item, or lender decision criterion. Please use it as a personal planning aid.</p><p class="muted">Report reference: ${html(input.reportId)}</p></article></div>`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;background:#eff5f8;color:#10233d;font-family:Arial,Helvetica,sans-serif}.page{position:relative;width:210mm;height:297mm;page-break-after:always;background:#fff;padding:16mm 16mm 18mm;overflow:hidden}.page:last-child{page-break-after:auto}header{display:flex;align-items:center;border-bottom:1px solid #d9e4eb;padding-bottom:5mm}.brand{font-size:14px;font-weight:800;letter-spacing:1px;color:#123c73}.brand span{color:#00a8a7}.page-title{margin-left:10mm;font-size:10px;color:#6a7c90;text-transform:uppercase;letter-spacing:1px}.page-number{margin-left:auto;color:#6a7c90;font-size:10px}main{padding-top:6mm}.subtitle{font-size:11px;line-height:1.5;color:#64778b;margin:0 0 6mm}footer{position:absolute;bottom:6mm;left:16mm;right:16mm;color:#8393a3;font-size:8px;border-top:1px solid #e3ebf0;padding-top:3mm}.cover{padding-top:22mm}.eyebrow{font-size:11px;color:#00a8a7;font-weight:700;letter-spacing:1.5px}.cover h1{font-size:37px;line-height:1.08;margin:10mm 0 6mm;letter-spacing:-1px}.cover h1 em{font-style:normal;color:#176be8}.cover>p{font-size:14px;line-height:1.6;color:#566d84;max-width:130mm}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:4mm;margin:7mm 0}.card{border:1px solid #dbe6ed;border-radius:3mm;padding:4mm;background:#f8fbfd;min-height:28mm}.card div{font-size:9px;color:#718399;text-transform:uppercase;letter-spacing:.45px}.card strong{display:block;margin-top:3mm;font-size:15px;color:#132b4c;line-height:1.15}.card.positive strong{color:#078866}.card.negative strong{color:#c0393c}.profile-strip{display:flex;justify-content:space-between;align-items:flex-end;margin-top:25mm;border-top:2px solid #176be8;padding-top:5mm}.profile-strip b{display:block;font-size:15px}.profile-strip span{display:block;font-size:10px;color:#6a7c90;margin-top:2mm}.confidential{font-size:9px;letter-spacing:1px;color:#8b9aab}.split{display:grid;grid-template-columns:1fr 1fr;gap:7mm}article{border:1px solid #dbe6ed;border-radius:3mm;padding:5mm;background:#fff}h2{font-size:16px;margin:0 0 4mm;color:#10233d}h3{font-size:11px;margin:5mm 0 3mm;color:#40566d}p{font-size:11px;line-height:1.55;color:#51677c}table{width:100%;border-collapse:collapse;font-size:9px}th{text-align:left;color:#6a7c90;font-size:8px;text-transform:uppercase;letter-spacing:.4px;padding:2.5mm;border-bottom:1px solid #cfdde6}td{padding:2.6mm;border-bottom:1px solid #e7edf1;vertical-align:top;color:#263b51}.callout{margin-top:5mm;background:#eef7ff;border-left:3px solid #176be8;padding:4mm;font-size:10px;line-height:1.5;color:#37536f}.note,.muted{font-size:9px;color:#73869a}.empty{padding:8mm;border:1px dashed #cbd9e3;background:#f8fbfd;color:#62788f;font-size:11px;text-align:center}.signals{padding-left:5mm;margin:0}.signals li{font-size:11px;line-height:1.5;margin:0 0 4mm;padding:3mm 4mm;background:#fff7f5;border-left:3px solid #e47d62;list-style:none}.timeline{border-left:2px solid #176be8;margin:6mm 0 7mm;padding-left:6mm}.timeline-row{display:flex;gap:4mm;margin:0 0 4mm}.timeline-row>b{display:grid;place-items:center;flex:0 0 6mm;height:6mm;background:#176be8;color:#fff;border-radius:50%;font-size:8px}.timeline-row span{font-size:9px;color:#00a8a7;font-weight:700;text-transform:uppercase;letter-spacing:.5px}.timeline-row p{margin:1mm 0 0;font-size:11px}.checklist{padding-left:5mm;margin:0}.checklist li{font-size:10px;line-height:1.5;margin:0 0 3mm;list-style:'✓  '}</style></head><body>${page('Financial analysis', 'A practical summary of your reported credit profile and financial planning signals.', cover, 1)}${page('Financial snapshot', 'Key profile and exposure details returned by the bureau response.', snapshot, 2)}${page('Credit portfolio', 'A closer look at reported borrowing and balance information.', portfolio, 3)}${page('Behaviour & risk', 'Enquiry and repayment indicators that may be relevant to credit planning.', behavior, 4)}${page('Action plan', 'Steps to help maintain an organised credit profile over time.', actionPlan, 5)}</body></html>`;
}

export async function renderFinancialAnalysisPdf(input: FinancialReportPdfInput) {
  return renderHtmlPdf(generateFinancialAnalysisHtml(input), { format: 'A4', scale: 0.96 });
}
