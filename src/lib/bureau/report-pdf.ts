import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { generateBureauReportHtml, type BureauReportInput } from './report-template';

async function getBrowserRuntime() {
  const localChromePaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];
  const local = localChromePaths.find((path) => existsSync(path));
  if (local) {
    return {
      executablePath: local,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
      isLocal: true,
    };
  }

  const chromium = await import('@sparticuz/chromium');
  return {
    executablePath: await chromium.default.executablePath(),
    args: chromium.default.args,
    isLocal: false,
  };
}

export async function renderBureauReportPdf(input: BureauReportInput): Promise<Buffer> {
  const html = generateBureauReportHtml(withProviderLogo(input));
  return renderHtmlPdf(html, { scale: 0.94 });
}

export async function renderHtmlPdf(html: string, options?: { scale?: number; format?: 'letter' | 'A4' }): Promise<Buffer> {
  const puppeteer = await import('puppeteer-core');
  const browserRuntime = await getBrowserRuntime();

  const browser = await puppeteer.default.launch({
    args: browserRuntime.args,
    defaultViewport: { width: 1280, height: 1600 },
    executablePath: browserRuntime.executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const pdf = await page.pdf({
      format: options?.format || 'letter',
      printBackground: true,
      displayHeaderFooter: false,
      margin: {
        top: '0.18in',
        right: '0.25in',
        bottom: '0.18in',
        left: '0.25in',
      },
      scale: options?.scale ?? 0.94,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export function renderBureauReportHtml(input: BureauReportInput) {
  return generateBureauReportHtml(withProviderLogo(input));
}

function withProviderLogo(input: BureauReportInput): BureauReportInput {
  if (input.providerLogoDataUrl !== 'bundled') return input;
  const logoPath = path.join(process.cwd(), 'public', 'transunion-cibil-logo.png');
  const logo = readFileSync(logoPath).toString('base64');
  return { ...input, providerLogoDataUrl: `data:image/png;base64,${logo}` };
}
