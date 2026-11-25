import PDFDocument from 'pdfkit';
import * as pdfkitRuntime from 'pdfkit';
import type { BureauReportInput } from './report-template';

const { registerStdFonts } = pdfkitRuntime as unknown as {
  registerStdFonts: (...fonts: unknown[]) => void;
};
registerStdFonts(
  require('pdfkit/standard-fonts/Helvetica'),
  require('pdfkit/standard-fonts/HelveticaBold')
);

type RecordValue = Record<string, unknown>;

function record(value: unknown): RecordValue {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : {};
}

function rows(value: unknown): RecordValue[] {
  return Array.isArray(value) ? value.map(record) : [];
}

function field(value: unknown): string {
  return value == null || value === '' ? '-' : String(value).replace(/\s+/g, ' ').trim();
}

function date(value: unknown): string {
  const raw = field(value);
  return /^\d{8}$/.test(raw) ? `${raw.slice(0, 2)}-${raw.slice(2, 4)}-${raw.slice(4)}` : raw;
}

function money(value: unknown): string {
  const raw = field(value);
  const amount = Number(raw);
  return raw === '-' || !Number.isFinite(amount) ? raw : new Intl.NumberFormat('en-IN').format(amount);
}

const accountTypes: Record<string, string> = {
  '01': 'AUTO LOAN', '02': 'HOUSING LOAN', '03': 'PROPERTY LOAN',
  '05': 'PERSONAL LOAN', '06': 'CONSUMER LOAN', '07': 'GOLD LOAN',
  '08': 'EDUCATION LOAN', '10': 'CREDIT CARD', '13': 'TWO-WHEELER LOAN',
  '17': 'COMMERCIAL VEHICLE LOAN', '32': 'BUSINESS LOAN',
  '50': 'SECURED BUSINESS LOAN', '51': 'UNSECURED BUSINESS LOAN',
};

function reportBody(rawJson: unknown): RecordValue {
  const raw = record(rawJson);
  const response = record(raw.response);
  const rawField = record(raw.raw);
  const rawJsonField = record(raw.raw_json);
  const data = record(raw.data);
  const providerResponse = record(raw.providerResponse);
  const candidates = [
    raw.body, raw.response, rawField.body, response.body,
    record(response.raw).body, rawJsonField.body, rawJsonField.response,
    record(rawJsonField.response).body, record(data.raw).body, data.body,
    record(providerResponse.raw).body, providerResponse.data, raw,
  ];
  return record(candidates.find((candidate) => Array.isArray(record(candidate).consumerCreditData)));
}

export function largeReportCounts(rawJson: unknown) {
  const credit = rows(reportBody(rawJson).consumerCreditData)[0] ?? {};
  return { accounts: rows(credit.accounts).length, enquiries: rows(credit.enquiries).length };
}

export async function renderLargeBureauReportPdf(input: BureauReportInput): Promise<Buffer> {
  const body = reportBody(input.rawJson);
  const credit = rows(body.consumerCreditData)[0] ?? {};
  const summary = record(body.consumerSummaryData);
  const accountSummary = record(summary.accountSummary);
  const enquirySummary = record(summary.inquirySummary);
  const name = rows(credit.names)[0] ?? {};
  const score = rows(credit.scores)[0] ?? {};
  const accounts = rows(credit.accounts);
  const enquiries = rows(credit.enquiries);
  const customerName = field(name.name === undefined ? input.fallbackName : name.name);
  const reportId = field(input.reportId);
  const doc = new PDFDocument({ size: 'A4', margin: 38, autoFirstPage: false, compress: true });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const finished = new Promise<Buffer>((resolve, reject) => {
    doc.once('end', () => resolve(Buffer.concat(chunks)));
    doc.once('error', reject);
  });
  let pageNumber = 0;
  const addPage = () => {
    doc.addPage();
    pageNumber += 1;
    doc.rect(38, 27, 519, 28).fill('#ffdd00');
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#20242b').text('CONSUMER CIR', 45, 34);
    doc.font('Helvetica').fontSize(7).fillColor('#555555')
      .text('CreditTrust-generated view of saved bureau data', 38, 61)
      .text(`Report ID: ${reportId}    Page ${pageNumber}`, 38, 72);
    doc.moveTo(38, 87).lineTo(557, 87).lineWidth(1.5).strokeColor('#00a3d7').stroke();
    doc.y = 99;
  };
  const ensureSpace = (height: number) => {
    if (doc.y + height > 800) addPage();
  };
  const title = (label: string) => {
    ensureSpace(34);
    doc.moveDown(0.6).font('Helvetica-Bold').fontSize(10).fillColor('#666666').text(label);
    doc.moveDown(0.35);
  };
  const line = (label: string, value: unknown) => {
    ensureSpace(17);
    const y = doc.y;
    doc.rect(38, y, 519, 15).fill('#eeeeee');
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#00a3d7').text(`${label}: `, 43, y + 3, { continued: true });
    doc.font('Helvetica').fillColor('#222222').text(field(value), { width: 500 });
    doc.y = Math.max(doc.y, y + 17);
  };

  addPage();
  title('CONSUMER INFORMATION:');
  line('Name', customerName);
  line('Date of birth', date(name.birthDate ?? name.dateOfBirth));
  line('Report date', date(input.createdAt));
  title('CIBIL TRANSUNION SCORE(S):');
  line(field(score.scoreName), score.score);
  const reasons = rows(score.reasonCodes).map((reason) => field(reason.reasonCodeValue)).join(', ');
  if (reasons) line('Scoring factors', reasons);
  title('IDENTIFICATION(S):');
  rows(credit.ids).forEach((id) => line(`ID ${field(id.idType)}`, id.idNumber));
  title('TELEPHONE(S):');
  rows(credit.telephones).forEach((phone) => line('Telephone', phone.telephoneNumber));
  title('EMAIL CONTACT(S):');
  rows(credit.emails).forEach((email) => line('Email', email.emailID));
  title('ADDRESS(ES):');
  rows(credit.addresses).forEach((address) => {
    line('Address', [address.line1, address.line2, address.line3, address.line4, address.line5, address.state, address.pinCode].filter(Boolean).join(', '));
  });
  const employment = rows(credit.employment)[0];
  if (employment) {
    title('EMPLOYMENT INFORMATION:');
    line('Occupation code', employment.occupationCode);
    line('Income', employment.income);
  }

  title('SUMMARY:');
  line('Total accounts', accountSummary.totalAccounts ?? accounts.length);
  line('Current balance', money(accountSummary.currentBalance));
  line('Overdue balance', money(accountSummary.overdueBalance));
  line('Total enquiries', enquirySummary.totalInquiry ?? enquiries.length);
  line('Enquiries past 30 days', enquirySummary.inquiryPast30Days);
  line('Enquiries past 12 months', enquirySummary.inquiryPast12Months);

  title(`ACCOUNT(S): ${accounts.length}`);
  accounts.forEach((account, index) => {
    ensureSpace(account.paymentHistory ? 170 : 125);
    const memberName = field(account.memberShortName ?? account.memberName);
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#00a3d7')
      .text(`${index + 1}. ${memberName}`, { width: 519 });
    line('Account number / type', `${field(account.accountNumber)} / ${accountTypes[field(account.accountType)] ?? field(account.accountType)}`);
    line('Opened / reported', `${date(account.dateOpened)} / ${date(account.dateReported)}`);
    line('Last payment / ownership', `${date(account.lastPaymentDate)} / ${field(account.ownershipIndicator)}`);
    line('Payment history start / end', `${date(account.paymentStartDate)} / ${date(account.paymentEndDate)}`);
    line('High credit / current / overdue', `${money(account.highCreditAmount ?? account.creditLimit)} / ${money(account.currentBalance)} / ${money(account.amountOverdue)}`);
    if (account.paymentFrequency) line('Payment frequency', account.paymentFrequency);
    if (account.suitFiledStatus) line('Suit filed status', account.suitFiledStatus);
    if (account.paymentHistory) {
      line('Days past due / asset classification (up to 36 months)', account.paymentHistory);
    }
    doc.moveDown(0.35);
  });

  title(`ENQUIRIES: ${enquiries.length}`);
  enquiries.forEach((enquiry, index) => {
    ensureSpace(37);
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#00a3d7')
      .text(`${index + 1}. ${field(enquiry.memberShortName ?? enquiry.memberName)}`);
    line('Date / purpose / amount', `${date(enquiry.enquiryDate)} / ${accountTypes[field(enquiry.enquiryPurpose)] ?? field(enquiry.enquiryPurpose)} / ${money(enquiry.enquiryAmount)}`);
    doc.moveDown(0.2);
  });

  ensureSpace(24);
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#00a3d7').text(`END OF REPORT ON ${customerName}`);
  doc.end();
  return finished;
}
