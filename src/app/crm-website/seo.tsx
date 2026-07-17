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
  description: 'Credit CRM software for live credit reports, eligibility checks, and loan file tracking',
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
  name: 'CreditTrust CRM',
  description: 'Credit CRM software for loan lead management, live credit reports, eligibility checking, and lender routing',
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
  title: 'Loan CRM Software India - Live Credit Reports & File Tracking | CreditTrust',
  description:
    "CreditTrust is a modern CRM for loan teams, fintech partners, and sourcing businesses. Manage leads, pull consent-based live credit reports, check eligibility, route files to lenders, and track performance from one workspace.",
  keywords: [
    'loan CRM software India',
    'loan team CRM',
    'credit workflow management software',
    'loan distribution CRM',
    'CRM for loan teams India',
    'loan sourcing software',
    'loan lead management CRM',
  ],
  imageAlt: 'CreditTrust CRM Platform',
});

export const aboutMetadata = createCrmMetadata({
  title: 'About CreditTrust - Modern Loan CRM & Credit Workflow Software',
  description:
    'CreditTrust is built for loan teams, fintech partners, channel partners, and sourcing businesses. Trusted loan distribution software designed for Indian credit workflows.',
  keywords: [
    'CreditTrust CRM',
    'best loan CRM India',
    'trusted loan distribution software',
    'loan CRM India',
    'loan team CRM India',
    'channel partner CRM',
  ],
  path: '/about',
  imageAlt: 'About CreditTrust CRM',
});

export const contactMetadata = createCrmMetadata({
  title: 'Book a Free Loan CRM Demo - CreditTrust',
  description:
    "Book a free demo of CreditTrust CRM for loan teams, fintech partners, and sourcing businesses. See live credit reports, eligibility checks, and loan file tracking in one workspace.",
  keywords: [
    'loan CRM free demo',
    'book demo loan CRM India',
    'CreditTrust demo request',
    'loan CRM demo India',
    'loan sourcing software demo',
    'loan team CRM demo',
  ],
  path: '/contact',
  imageAlt: 'Book CreditTrust CRM Demo',
});

export const eligibilityMetadata = createCrmMetadata({
  title: 'Loan Eligibility Checker - Live Credit Reports & Customer Intelligence | CreditTrust',
  description:
    'CreditTrust eligibility checker helps loan teams pull consent-based live credit reports, review customer profile strength, and check eligibility before routing files to lenders.',
  keywords: [
    'loan eligibility checker',
    'customer eligibility intelligence',
    'FOIR calculator',
    'loan eligibility check tool India',
    'live credit report check',
    'download CIBIL report',
    'loan eligibility CIBIL score',
    'credit score check',
    'eligibility check for loan teams',
    'lender matching software',
  ],
  path: '/eligibility-checker',
  imageAlt: 'CreditTrust Loan Eligibility Checker',
});

export const featuresMetadata = createCrmMetadata({
  title: 'Loan CRM Features - Lead Management, Eligibility & Lender Routing | CreditTrust',
  description:
    'Explore CreditTrust loan CRM features built for loan teams and fintech partners: lead management, loan file tracking, live credit report workflows, eligibility checking, lender routing, team management, and credit accounting.',
  keywords: [
    'loan CRM features',
    'CRM for loan teams',
    'lead management for loan teams',
    'loan file tracking software',
    'loan lead tracking',
    'loan pipeline management',
    'lender routing software',
    'team management software',
  ],
  path: '/features',
  imageAlt: 'CreditTrust Loan CRM Features',
});

export const pricingMetadata = createCrmMetadata({
  title: 'Loan CRM Pricing - Credit Workflow Software Plans India | CreditTrust',
  description:
    'Transparent loan CRM pricing for every team size. Plans are customized based on users, modules, live credit report usage, eligibility credits, and workflow requirements.',
  keywords: [
    'loan CRM pricing',
    'loan CRM software cost India',
    'affordable CRM for loan teams',
    'loan sourcing software plans',
    'loan CRM India pricing',
    'credit CRM plans',
  ],
  path: '/pricing',
  imageAlt: 'CreditTrust CRM Pricing',
});

export const homeSchemas = [
  organizationSchema,
  webPageSchema('CreditTrust CRM', '/', 'Loan lead management, eligibility checking, and file routing for loan teams'),
  softwareApplicationSchema,
];

export const aboutSchemas = [
  organizationSchema,
  webPageSchema('About CreditTrust', '/about', 'Learn about CreditTrust CRM'),
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
  webPageSchema('CreditTrust Features', '/features', 'Complete feature set for loan lead management, eligibility checks, and file tracking'),
  softwareApplicationSchema,
];

export const pricingSchemas = [
  organizationSchema,
  webPageSchema('CreditTrust Pricing', '/pricing', 'Pricing plans for loan CRM and credit workflow software'),
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'What are eligibility credits?', acceptedAnswer: { '@type': 'Answer', text: 'Eligibility credits are used when you run a consent-based customer profile check through CreditTrust. Each check uses 1 credit. Credits are purchased in packs and managed by the admin. Usage is tracked per agent with a full audit trail.' } },
      { '@type': 'Question', name: 'Can I add more agents to my plan?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Each plan has a default user limit, but you can request additional agent seats. Talk to our team to get a custom quote based on your team size.' } },
      { '@type': 'Question', name: 'Is there a free trial available?', acceptedAnswer: { '@type': 'Answer', text: 'We offer a guided demo session rather than a self-serve trial. This ensures your team gets properly onboarded and you see the features most relevant to your loan workflow. Book a demo to get started.' } },
      { '@type': 'Question', name: 'What loan products does CreditTrust support?', acceptedAnswer: { '@type': 'Answer', text: 'CreditTrust supports all major loan products - Personal Loan, Business Loan, Home Loan, Loan Against Property, Used Car Loan, and more. Product categories can be customized for your loan team.' } },
      { '@type': 'Question', name: 'How is billing handled?', acceptedAnswer: { '@type': 'Answer', text: 'Platform subscription is billed monthly or annually. Eligibility credits are billed separately per purchase. Invoices are generated automatically in the platform.' } },
      { '@type': 'Question', name: 'Is my customer data secure?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. CreditTrust uses role-based access controls, consent-first workflows, and secure data handling practices. Agents can only see leads and files assigned to them. Admin has full visibility and control.' } },
    ],
  },
];
