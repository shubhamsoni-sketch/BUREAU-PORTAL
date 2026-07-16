const navItems = [
  ["Home", "/"],
  ["Features", "/features"],
  ["Eligibility Checker", "/eligibility-checker"],
  ["Lead Management", "/lead-file-management"],
  ["Lender Workflow", "/lender-workflow"],
  ["Pricing", "/pricing"],
  ["Contact", "/contact"],
];

const loginUrl = "https://crm.credittrust.in/crm/sign-up-login-screen";

const featureCards = [
  ["Lead capture and tracking", "Centralize inbound enquiries, source tags, customer notes, and owner assignment in one loan agent CRM.", "contact"],
  ["Eligibility checker", "Use consent-based customer checks and credit readiness insights before choosing the next lender.", "gauge"],
  ["File status pipeline", "Track documents, pending steps, lender movement, sanction status, and disbursal readiness.", "file"],
  ["Lender workflow CRM", "Map customer fit to banks or NBFCs, maintain lender notes, and move files with better routing.", "building"],
  ["Follow-up reminders", "Prevent missed calls, pending documents, and aging leads with clear reminders for every agent.", "bell"],
  ["Team and role control", "Run admin, manager, and agent roles with controlled access, lead assignment, and credit usage visibility.", "users"],
  ["Eligibility credits", "Track usage-based eligibility credits by branch, user, or team without losing accounting clarity.", "credit"],
  ["Reports and performance", "See lead sources, follow-up health, agent output, lender progress, and monthly business momentum.", "chart"],
];

const icons = {
  arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 5l7 7-7 7"/></svg>',
  bell: '<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  building: '<svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h7v18M14 8h5v13M8 7h2M8 11h2M8 15h2"/></svg>',
  chart: '<svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m7 16 4-4 3 3 5-7"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
  contact: '<svg viewBox="0 0 24 24"><path d="M16 2v4M8 2v4M3 10h18"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M8 14h8M8 18h5"/></svg>',
  credit: '<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>',
  file: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 15l2 2 4-4"/></svg>',
  filter: '<svg viewBox="0 0 24 24"><path d="M22 3H2l8 9.5V21l4-2v-6.5z"/></svg>',
  gauge: '<svg viewBox="0 0 24 24"><path d="M12 14l4-4"/><path d="M20.3 18a9 9 0 1 0-16.6 0"/></svg>',
  headphones: '<svg viewBox="0 0 24 24"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-8h1a2 2 0 0 1 2 2zM3 19a2 2 0 0 0 2 2h1v-8H5a2 2 0 0 0-2 2z"/></svg>',
  layers: '<svg viewBox="0 0 24 24"><path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/></svg>',
  line: '<svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m7 14 4-4 4 4 5-8"/></svg>',
  phone: '<svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
  route: '<svg viewBox="0 0 24 24"><circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M12 19h4.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H12"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>',
  users: '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>',
};

const pages = {
  "/": home,
  "/features": () => pageShell("Feature stack", "Loan lead management software with every daily DSA workflow in one place.", "CreditTrust combines DSA lead tracking, eligibility intelligence, lender workflow, file tracking, team control, and business reports.", featureGrid(true) + workflowPreview()),
  "/eligibility-checker": () => pageShell("Eligibility intelligence", "Know customer eligibility faster before wasting time on the wrong lender.", "Use consent-based verification, credit readiness insights, and profile assessment to qualify leads more confidently.", twoColumn(insightPanel(), ["Faster customer qualification for personal, business, home, LAP, and vehicle loan enquiries.", "Better lender mapping using customer profile, product fit, and internal notes.", "Reduced rejection chances by routing suitable files earlier in the journey.", "Usage-based eligibility credits with role-based access and team-level control."])),
  "/lead-file-management": () => pageShell("Lead and file management", "From first call to disbursal, track every customer and file in one CRM.", "Give agents a clear operating system for lead pipeline, customer notes, follow-ups, documents, application movement, and disbursal tracking.", twoColumn(pipelinePanel(), ["Lead pipeline stages for new, contacted, qualified, document pending, login, sanction, and disbursal.", "Customer notes and follow-up history available to managers without manual calling around.", "File status, application movement, and pending document tracking in a single view.", "Agent assignment and missed follow-up prevention for growing DSA offices."], true)),
  "/team-management": () => pageShell("Team control", "Run admin, manager, and agent roles without losing visibility.", "CreditTrust DSA CRM helps multi-agent loan offices assign work, monitor activity, and control sensitive actions.", featureList([["Admin, manager, and agent roles", "Give each user the right level of access for leads, reports, and credits."], ["Lead assignment", "Move new enquiries to branches, managers, or agents with clean ownership."], ["Agent activity tracking", "See follow-up health, file movement, and productivity across the team."], ["Credit usage control", "Track eligibility credit usage and keep access limited to approved users."]])),
  "/lender-workflow": () => pageShell("Lender workflow CRM", "Improve approval chances with smarter lender routing.", "Match profiles to suitable lenders, track lender-wise file progress, and keep every bank or NBFC condition close to the file.", twoColumn(lenderPanel(), ["Match customer profile to suitable lenders based on product, income, geography, and internal lender notes.", "Track lender-wise progress across banks and NBFCs without spreadsheet drift.", "Move rejected cases to another lender while keeping case history intact.", "Compare status across lenders and improve approval chances with cleaner routing."])),
  "/pricing": pricing,
  "/about": () => pageShell("Trust and security", "Built for Indian DSA and loan distribution workflows.", "CreditTrust is designed around secure customer-data handling, consent-first eligibility processes, role-based access, usage tracking, and support for growing finance teams.", featureList([["Secure customer-data handling", "Keep important loan customer records structured and accessible only to the right users."], ["Consent-first process", "Run customer checks with clear business controls and accountable usage."], ["Role-based access", "Protect team operations with admin, manager, and agent level permissions."], ["Growth support", "Give expanding DSA teams a practical CRM foundation before operations become scattered."]])),
  "/contact": contact,
};

const isFilePreview = location.protocol === "file:";

function icon(name) {
  return icons[name] || icons.check;
}

function home() {
  return `
    <section class="hero section-band">
      <div class="hero-copy">
        <p class="eyebrow">DSA CRM software for Indian loan teams</p>
        <h1>DSA CRM built for faster loan eligibility, lead tracking, and file movement.</h1>
        <p class="hero-text">Manage leads, check customer fit, assign files, select lenders, track follow-ups, and grow your loan business from one dashboard.</p>
        <div class="hero-actions">
          <a class="button primary" href="/contact" data-link>Book Demo ${icon("arrow")}</a>
          <a class="button secondary" href="/features" data-link>View Features</a>
          <a class="button ghost" href="${loginUrl}">Login to CRM</a>
        </div>
        <div class="hero-metrics" aria-label="Product benefits">
          <span><strong>360</strong>lead-to-disbursal view</span>
          <span><strong>Role</strong>based team access</span>
          <span><strong>Credit</strong>readiness insights</span>
        </div>
      </div>
      ${productMockup()}
    </section>
    ${logoStrip()}
    ${problemSolution()}
    ${featureGrid()}
    ${ctaBand()}
  `;
}

function pageShell(eyebrow, title, text, children) {
  return `
    <section class="page-hero section-band">
      <p class="eyebrow">${eyebrow}</p>
      <h1>${title}</h1>
      <p>${text}</p>
    </section>
    ${children}
  `;
}

function productMockup() {
  return `
    <div class="mockup" aria-label="CreditTrust dashboard mockup">
      <div class="mockup-header"><span></span><strong>Lead Command Center</strong><small>Today</small></div>
      <div class="mockup-grid">
        <div class="mockup-card span-2"><div><small>Qualified leads</small><strong>84</strong></div>${icon("line")}</div>
        <div class="mockup-card green"><div><small>Credit ready</small><strong>31</strong></div></div>
        <div class="pipeline-board">
          ${["New", "Fit check", "Login", "Sanction"].map((stage, index) => `<div class="pipeline-column"><b>${stage}</b><span style="width:${92 - index * 14}%"></span><span style="width:${74 - index * 9}%"></span><span style="width:${58 - index * 6}%"></span></div>`).join("")}
        </div>
        <div class="mockup-card"><div><small>Lender match</small><strong>Axis · HDFC · Tata Capital</strong></div></div>
        <div class="mockup-card navy"><div><small>Follow-ups due</small><strong>12</strong></div></div>
      </div>
    </div>
  `;
}

function logoStrip() {
  return `<section class="trust-strip" aria-label="Trusted workflows">${["DSAs", "Loan consultants", "Channel partners", "Finance distributors", "Multi-agent loan offices"].map((item) => `<span>${icon("check")} ${item}</span>`).join("")}</section>`;
}

function problemSolution() {
  const cards = [
    ["filter", "Scattered leads", "Bring calls, enquiries, source tags, and ownership into one DSA lead tracking view."],
    ["bell", "Manual follow-ups", "Give every agent a reminder-led workflow so hot customers do not go cold."],
    ["route", "Wrong lender routing", "Use eligibility insights and lender notes before pushing the file forward."],
    ["layers", "No file visibility", "Track every stage from first call to login, sanction, and disbursal."],
  ];
  return `<section class="split-section"><div><p class="eyebrow">The daily drag</p><h2>Scattered leads, manual follow-ups, and wrong lender selection slow every file.</h2></div><div class="solution-grid">${cards.map(([i, t, x]) => card(i, t, x)).join("")}</div></section>`;
}

function featureGrid(compact = false) {
  return `<section class="${compact ? "feature-section compact" : "feature-section"}"><div class="section-heading"><p class="eyebrow">One CRM for the full loan journey</p><h2>Lead management, eligibility intelligence, files, lenders, teams, and reports.</h2></div><div class="feature-grid">${featureCards.map(([title, text, i]) => card(i, title, text)).join("")}</div></section>`;
}

function card(i, title, text) {
  return `<article class="feature-card">${icon(i)}<h3>${title}</h3><p>${text}</p></article>`;
}

function twoColumn(visual, items, reverse = false) {
  return `<section class="${reverse ? "two-column reverse" : "two-column"}"><div class="bullet-panel">${items.map((item) => `<p>${icon("check")} ${item}</p>`).join("")}</div>${visual}</section>`;
}

function featureList(items) {
  return `<section class="feature-list">${items.map(([title, text]) => `<article>${icon("shield")}<div><h2>${title}</h2><p>${text}</p></div></article>`).join("")}</section>`;
}

function insightPanel() {
  return `<div class="insight-panel visual-panel"><span>Profile assessment</span><strong>High fit</strong><div class="score-ring">82</div><p>Credit readiness, income profile, city, and loan product fit reviewed for smarter qualification.</p></div>`;
}

function pipelinePanel() {
  return `<div class="visual-panel stage-panel">${["New lead", "Docs pending", "Lender login", "Sanction", "Disbursal"].map((stage, index) => `<span class="${index < 3 ? "active" : ""}">${stage}</span>`).join("")}</div>`;
}

function lenderPanel() {
  return `<div class="visual-panel lender-panel">${["HDFC Bank", "Axis Bank", "Tata Capital", "IDFC First"].map((name, index) => `<div>${icon("building")}<span>${name}</span><b>${["Matched", "Review", "Docs", "Backup"][index]}</b></div>`).join("")}</div>`;
}

function workflowPreview() {
  return `<section class="workflow-preview"><div>${icon("building")}<h2>Lead-to-disbursal workflow</h2><p>Capture lead, assess fit, collect documents, select lender, track file, record outcomes, and report team performance.</p></div><div>${icon("file")}<h2>Manager visibility</h2><p>Monitor team activity, follow-up gaps, pending files, lender status, and eligibility credit usage without spreadsheet chasing.</p></div></section>`;
}

function pricing() {
  const plans = [
    ["Starter", "For small DSAs and solo loan consultants", "Lead tracking", "Basic reports", "Eligibility credits"],
    ["Growth", "For multi-agent DSA offices", "Team roles", "Lender workflow", "Follow-up automation"],
    ["Business", "For larger channel partners", "Branch visibility", "Advanced reports", "Credit usage controls"],
    ["Custom", "For finance distributors", "Module selection", "Workflow configuration", "Priority onboarding"],
  ];
  return pageShell("Pricing", "Plans shaped around team size, usage credits, modules, and workflow requirements.", "Start with a product demo, share your monthly lead volume, and we will recommend the right setup.", `<div class="pricing-grid">${plans.map(([name, description, a, b, c]) => `<article class="price-card"><h2>${name}</h2><p>${description}</p>${[a, b, c].map((item) => `<span>${icon("check")} ${item}</span>`).join("")}<a class="button secondary" href="/contact" data-link>Request Pricing</a></article>`).join("")}</div>${ctaBand()}`);
}

function contact() {
  const products = ["Personal Loan", "Business Loan", "Home Loan", "LAP", "Used Car Loan", "Other"];
  return pageShell("Book a demo", "See how CreditTrust DSA CRM can fit your loan business.", "Share a few details and the team can walk you through lead tracking, eligibility intelligence, lender workflow, file status, and reporting.", `
    <section class="contact-layout">
      <form class="demo-form">
        <label>Name<input placeholder="Your name"></label>
        <label>Mobile number<input placeholder="+91 98765 43210"></label>
        <label>Business name<input placeholder="Your DSA or firm name"></label>
        <label>City<input placeholder="Mumbai, Delhi, Jaipur..."></label>
        <label>Team size<select><option>Select team size</option><option>1-3</option><option>4-10</option><option>11-25</option><option>25+</option></select></label>
        <label>Monthly lead volume<select><option>Select lead volume</option><option>Under 100</option><option>100-500</option><option>500-1000</option><option>1000+</option></select></label>
        <fieldset><legend>Loan products handled</legend><div class="checkbox-grid">${products.map((product) => `<label><input type="checkbox"> ${product}</label>`).join("")}</div></fieldset>
        <label class="full-span">Message<textarea placeholder="Tell us about your current lead and file workflow" rows="4"></textarea></label>
        <button class="button primary full-span" type="button">Request Product Demo ${icon("arrow")}</button>
      </form>
      <aside class="contact-card">${icon("headphones")}<h2>Prefer WhatsApp?</h2><p>Start a quick conversation with the CreditTrust team and share your DSA CRM requirement.</p><a class="button whatsapp" href="https://wa.me/919999999999?text=I%20want%20a%20CreditTrust%20DSA%20CRM%20demo">${icon("phone")} Chat on WhatsApp</a></aside>
    </section>
  `);
}

function ctaBand() {
  return `<section class="cta-band"><div><p class="eyebrow">Ready for cleaner DSA operations?</p><h2>Book a walkthrough of the CreditTrust DSA CRM.</h2></div><div class="cta-actions"><a class="button primary" href="/contact" data-link>Book Product Demo ${icon("arrow")}</a><a class="button light" href="${loginUrl}">Login to CRM</a></div></section>`;
}

function renderNav() {
  const nav = document.querySelector("#siteNav");
  nav.innerHTML = navItems.map(([label, path]) => `<a href="${routeHref(path)}" data-link>${label}</a>`).join("") + `<a class="nav-login" href="${loginUrl}">Login</a><a class="nav-cta" href="${routeHref("/contact")}" data-link>Book Demo</a>`;
}

function routeHref(path) {
  return isFilePreview ? `#${path}` : path;
}

function getRoutePath() {
  if (isFilePreview) {
    const hashPath = location.hash.replace(/^#/, "");
    return pages[hashPath] ? hashPath : "/";
  }

  return pages[location.pathname] ? location.pathname : "/";
}

function render() {
  const path = getRoutePath();
  document.querySelector("#app").innerHTML = pages[path]();
  document.querySelectorAll(".nav a").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === routeHref(path));
  });
  document.querySelector("#siteNav").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "instant" });
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-link]");
  if (!link) return;
  event.preventDefault();
  const href = link.getAttribute("href");
  const path = href.startsWith("#") ? href.slice(1) : href;
  if (isFilePreview) {
    location.hash = path;
  } else {
    history.pushState(null, "", path);
  }
  render();
});

document.querySelector("#menuButton").addEventListener("click", () => {
  document.querySelector("#siteNav").classList.toggle("open");
});

window.addEventListener("popstate", render);
window.addEventListener("hashchange", render);
renderNav();
render();
