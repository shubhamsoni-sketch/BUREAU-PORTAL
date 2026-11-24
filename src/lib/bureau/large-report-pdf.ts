import PDFDocument from 'pdfkit';
import type { BureauReportInput } from './report-template';

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
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#28355b').text('CREDIT BUREAU REPORT', 38, 30);
    doc.font('Helvetica').fontSize(8).fillColor('#586174').text(`Report ID: ${reportId}    Page ${pageNumber}`, 38, 47);
    doc.moveTo(38, 63).lineTo(557, 63).strokeColor('#d7deeb').stroke();
    doc.y = 76;
  };
  const ensureSpace = (height: number) => {
    if (doc.y + height > 800) addPage();
  };
  const title = (label: string) => {
    ensureSpace(34);
    doc.moveDown(0.6).font('Helvetica-Bold').fontSize(10).fillColor('#28355b').text(label);
    doc.moveDown(0.35);
  };
  const line = (label: string, value: unknown) => {
    ensureSpace(17);
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#394057').text(`${label}: `, { continued: true });
    doc.font('Helvetica').fillColor('#222222').text(field(value));
  };

  addPage();
  title('CONSUMER INFORMATION');
  line('Name', customerName);
  line('Date of birth', name.birthDate ?? name.dateOfBirth);
  line('Report date', input.createdAt);
  line('Score', score.score);
  line('Total accounts', accountSummary.totalAccounts ?? accounts.length);
  line('Total enquiries', enquirySummary.totalInquiry ?? enquiries.length);
  title('IDENTIFICATION AND CONTACT');
  rows(credit.ids).forEach((id) => line(`ID ${field(id.idType)}`, id.idNumber));
  rows(credit.telephones).forEach((phone) => line('Telephone', phone.telephoneNumber));
  rows(credit.emails).forEach((email) => line('Email', email.emailID));
  rows(credit.addresses).forEach((address) => {
    line('Address', [address.line1, address.line2, address.line3, address.line4, address.line5, address.state, address.pinCode].filter(Boolean).join(', '));
  });
  const employment = rows(credit.employment)[0];
  if (employment) {
    title('EMPLOYMENT');
    line('Occupation code', employment.occupationCode);
    line('Income', employment.income);
  }

  title(`ACCOUNTS (${accounts.length})`);
  accounts.forEach((account, index) => {
    ensureSpace(100);
    const memberName = field(account.memberShortName ?? account.memberName);
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#28355b')
      .text(`${index + 1}. ${memberName}`, { width: 519 });
    line('Account number / type', `${field(account.accountNumber)} / ${field(account.accountType)}`);
    line('Opened / reported', `${field(account.dateOpened)} / ${field(account.dateReported)}`);
    line('Last payment / ownership', `${field(account.lastPaymentDate)} / ${field(account.ownershipIndicator)}`);
    line('High credit / current / overdue', `${field(account.highCreditAmount ?? account.creditLimit)} / ${field(account.currentBalance)} / ${field(account.amountOverdue)}`);
    if (account.suitFiledStatus) line('Suit filed status', account.suitFiledStatus);
    if (account.paymentHistory) {
      const history = field(account.paymentHistory);
      line('Payment history', `${history.slice(0, 108)}${history.length > 108 ? '...' : ''}`);
    }
    doc.moveDown(0.35);
  });

  title(`ENQUIRIES (${enquiries.length})`);
  enquiries.forEach((enquiry, index) => {
    ensureSpace(37);
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#28355b')
      .text(`${index + 1}. ${field(enquiry.memberShortName ?? enquiry.memberName)}`);
    line('Date / purpose / amount', `${field(enquiry.enquiryDate)} / ${field(enquiry.enquiryPurpose)} / ${field(enquiry.enquiryAmount)}`);
    doc.moveDown(0.2);
  });

  ensureSpace(24);
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#28355b').text('END OF REPORT');
  doc.end();
  return finished;
}
