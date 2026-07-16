import type { Metadata } from 'next';

export const siteUrl = 'https://credittrust.in';
export const ogImage = '/assets/images/app_logo.png';

type Schema = Record<string, unknown>;

const organizationSchema: Schema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'CreditTrust',
  url: siteUrl,
  logo: `${siteUrl}${ogImage}`,
  description: 'DSA CRM software for loan lead management and eligibility checking',
  sameAs: [],
};

function webPageSchema(name: string, path: string, description: string): Schema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    url: `${siteUrl}${path}`,
    description,
    publisher: {
      '@type': 'Organization',
      name: 'CreditTrust',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}${ogImage}`,
      },
    },
  };
}

const softwareApplicationSchema: Schema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'CreditTrust DSA CRM',
  description: 'DSA CRM software for loan lead management, eligibility checking, and lender routing',
  url: siteUrl,
  applicationCategory: 'BusinessApplication',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
  },
};

export function createCrmMetadata(params: {
  title: string;
  description: string;
  keywords: string[];
  path?: string;
  imageAlt: string;
}): Metadata {
  const canonical = `${siteUrl}${params.path ?? ''}`;

  return {
    title: params.title,
    description: params.description,
    keywords: params.keywords,
    openGraph: {
      title: params.title,
      description: params.description,
      url: canonical,
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: params.imageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: params.title,
      description: params.description,
      images: [ogImage],
    },
    alternates: {
      canonical,
    },
  };
}

export function JsonLd({ data }: { data: Schema | Schema[] }) {
  const schemas = Array.isArray(data) ? data : [data];

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}

export const homeMetadata = createCrmMetadata({
  title: 'DSA CRM Software India - Loan Agent CRM & Lead Management | CreditTrust',
  description:
    "CreditTrust is India's leading DSA CRM software for loan agents and channel partners. Manage loan leads, check customer eligibility, route files to lenders, and track team performance - all from one modern loan distribution CRM.",
  keywords: [
    'DSA CRM software India',
    'loan agent CRM',
    'DSA management software',
    'loan distribution CRM',
    'CRM for loan agents India',
    'DSA software',
    'loan lead management CRM',
  ],
  imageAlt: 'CreditTrust DSA CRM Platform',
});

export const aboutMetadata = createCrmMetadata({
  title: 'About CreditTrust - Best CRM for DSA India | Trusted Loan Distribution Software',
  description:
    'CreditTrust is the best CRM for DSA India - built for loan agents, channel partners, and DSA businesses. Trusted loan distribution software designed for Indian loan workflows.',
  keywords: [
    'CreditTrust DSA CRM',
    'best CRM for DSA India',
    'trusted loan distribution software',
    'DSA CRM India',
    'loan agent CRM India',
    'channel partner CRM',
  ],
  path: '/about',
  imageAlt: 'About CreditTrust DSA CRM',
});

export const contactMetadata = createCrmMetadata({
  title: 'Book a Free DSA CRM Demo - Loan CRM India | CreditTrust',
  description:
    "Book a free demo of CreditTrust DSA CRM - India's loan CRM for agents and channel partners. See how our loan distribution software works for your DSA business. Our team responds within 24 hours.",
  keywords: [
    'DSA CRM free demo',
    'book demo loan CRM India',
    'CreditTrust demo request',
    'loan CRM demo India',
    'DSA software demo',
    'loan agent CRM demo',
  ],
  path: '/contact',
  imageAlt: 'Book CreditTrust DSA CRM Demo',
});

export const eligibilityMetadata = createCrmMetadata({
  title: 'Loan Eligibility Checker for DSA - CIBIL Check & Customer Intelligence | CreditTrust',
  description:
    'CreditTrust loan eligibility checker for DSA helps agents run CIBIL checks, download CIBIL reports, calculate FOIR, and check loan eligibility CIBIL score before routing files to lenders. Smarter customer eligibility intelligence for DSA teams.',
  keywords: [
    'loan eligibility checker for DSA',
    'customer eligibility intelligence',
    'FOIR calculator DSA',
    'loan eligibility check tool India',
    'CIBIL check for DSA',
    'download CIBIL report',
    'loan eligibility CIBIL score',
    'CIBIL score check DSA',
    'eligibility check loan agent',
    'lender matching DSA',
  ],
  path: '/eligibility-checker',
  imageAlt: 'CreditTrust Loan Eligibility Checker for DSA',
});

export const featuresMetadata = createCrmMetadata({
  title: 'Loan CRM Features - Lead Management, Eligibility & Lender Routing | CreditTrust',
  description:
    'Explore CreditTrust loan CRM features built for DSA teams: lead management for DSA, loan file tracking software, FOIR-based eligibility checking, lender routing, team management, and credit accounting.',
  keywords: [
    'loan CRM features',
    'CRM for loan agents',
    'lead management for DSA',
    'loan file tracking software',
    'DSA lead tracking',
    'loan pipeline management',
    'lender routing software DSA',
    'DSA team management software',
  ],
  path: '/features',
  imageAlt: 'CreditTrust Loan CRM Features',
});

export const pricingMetadata = createCrmMetadata({
  title: 'DSA CRM Pricing - Affordable Loan CRM Software Plans India | CreditTrust',
  description:
    'Transparent DSA CRM pricing for every team size. Affordable loan CRM software cost India - customized plans based on agents, modules, and eligibility credit usage. Book a demo for your DSA software quote.',
  keywords: [
    'DSA CRM pricing',
    'loan CRM software cost India',
    'affordable CRM for loan agents',
    'DSA software plans',
    'loan CRM India pricing',
    'DSA CRM plans',
  ],
  path: '/pricing',
  imageAlt: 'CreditTrust DSA CRM Pricing',
});

export const homeSchemas = [
  organizationSchema,
  webPageSchema('CreditTrust DSA CRM', '/', 'Loan lead management, eligibility checking, and file routing for DSAs'),
  softwareApplicationSchema,
];

export const aboutSchemas = [
  organizationSchema,
  webPageSchema('About CreditTrust', '/about', 'Learn about CreditTrust DSA CRM'),
];

export const contactSchemas = [
  organizationSchema,
  webPageSchema('Contact CreditTrust', '/contact', 'Get in touch with CreditTrust team'),
];

export const eligibilitySchemas = [
  organizationSchema,
  webPageSchema('CreditTrust Eligibility Checker', '/eligibility-checker', 'Eligibility checking and lender matching for loan applications'),
  {
    ...softwareApplicationSchema,
    name: 'CreditTrust Eligibility Checker',
    description: 'Consent-based eligibility checking and lender matching',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Check Customer Eligibility',
    description: 'Step-by-step guide to run eligibility checks and get lender recommendations',
    step: [
      { '@type': 'HowToStep', name: 'Enter Customer Details', text: 'Input customer profile information including income, employment type, and loan requirements' },
      { '@type': 'HowToStep', name: 'Obtain Consent', text: 'Get customer consent for profile verification and eligibility checking' },
      { '@type': 'HowToStep', name: 'Run Eligibility Check', text: 'CreditTrust analyzes profile strength and generates eligibility score' },
      { '@type': 'HowToStep', name: 'Review Lender Matches', text: 'Get smart recommendations for suitable lenders based on customer profile' },
      { '@type': 'HowToStep', name: 'Route to Lender', text: 'Send customer file to recommended lender for processing' },
    ],
  },
];

export const featuresSchemas = [
  organizationSchema,
  webPageSchema('CreditTrust Features', '/features', 'Complete feature set for DSA loan management'),
  softwareApplicationSchema,
];

export const pricingSchemas = [
  organizationSchema,
  webPageSchema('CreditTrust Pricing', '/pricing', 'Pricing plans for DSA CRM software'),
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'What are eligibility credits?', acceptedAnswer: { '@type': 'Answer', text: 'Eligibility credits are used when you run a consent-based customer profile check through CreditTrust. Each check uses 1 credit. Credits are purchased in packs and managed by the admin. Usage is tracked per agent with a full audit trail.' } },
      { '@type': 'Question', name: 'Can I add more agents to my plan?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Each plan has a default user limit, but you can request additional agent seats. Talk to our team to get a custom quote based on your team size.' } },
      { '@type': 'Question', name: 'Is there a free trial available?', acceptedAnswer: { '@type': 'Answer', text: 'We offer a guided demo session rather than a self-serve trial. This ensures your team gets properly onboarded and you see the features most relevant to your DSA workflow. Book a demo to get started.' } },
      { '@type': 'Question', name: 'What loan products does CreditTrust support?', acceptedAnswer: { '@type': 'Answer', text: 'CreditTrust supports all major loan products - Personal Loan, Business Loan, Home Loan, Loan Against Property, Used Car Loan, and more. Product categories can be customized for your DSA office.' } },
      { '@type': 'Question', name: 'How is billing handled?', acceptedAnswer: { '@type': 'Answer', text: 'Platform subscription is billed monthly or annually. Eligibility credits are billed separately per purchase. Invoices are generated automatically in the platform.' } },
      { '@type': 'Question', name: 'Is my customer data secure?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. CreditTrust uses role-based access controls, consent-first workflows, and secure data handling practices. Agents can only see leads and files assigned to them. Admin has full visibility and control.' } },
    ],
  },
];
