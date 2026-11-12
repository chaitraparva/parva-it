import { useEffect, useRef, useState } from "react";
import InquiryForm, { type InquiryPreset } from "./components/InquiryForm";
import { projects } from "./lib/portfolio";
import BrandMark from './components/BrandMark'

type IconName =
  | "arrow"
  | "building"
  | "chart"
  | "check"
  | "code"
  | "finance"
  | "menu"
  | "people"
  | "play"
  | "spark"
  | "workflow"
  | "x"
  | "layers"
  | "plug"
  | "pen"
  | "shield"
  | "target"
  | "external";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    building: (
      <>
        <path d="M4 21h16M6 21V5l6-3 6 3v16" />
        <path d="M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    code: (
      <>
        <path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14" />
      </>
    ),
    finance: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M16 8.5c-.8-.7-1.9-1-3.3-1-1.8 0-3.2.8-3.2 2s1.1 1.8 3.2 2.3 3.3 1 3.3 2.4-1.4 2.3-3.3 2.3c-1.5 0-2.8-.4-3.7-1.3M12.5 5.5v13" />
      </>
    ),
    menu: <path d="M4 8h16M4 16h16" />,
    people: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    play: <path d="m9 7 8 5-8 5V7Z" />,
    spark: (
      <path d="m12 3-1.5 5.5L5 10l5.5 1.5L12 17l1.5-5.5L19 10l-5.5-1.5L12 3ZM5 3v4M3 5h4M19 17v4M17 19h4" />
    ),
    workflow: (
      <>
        <rect x="3" y="3" width="6" height="6" rx="1" />
        <rect x="15" y="15" width="6" height="6" rx="1" />
        <path d="M9 6h3a3 3 0 0 1 3 3v6M15 18h-3a3 3 0 0 1-3-3V9" />
      </>
    ),
    x: <path d="m6 6 12 12M18 6 6 18" />,
    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 13 9 5 9-5M3 17.5l9 5 9-5" />
      </>
    ),
    plug: (
      <>
        <path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0V8ZM12 18v4" />
      </>
    ),
    pen: <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4ZM13.5 6.5l4 4" />,
    shield: (
      <>
        <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" />
      </>
    ),
    external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

// The four development projects (see src/lib/portfolio.ts). Kept under the original
// `products` name so the existing tabs, showcase and preview components keep working.
const products = projects.map((p) => ({
  ...p,
  name: p.label,
  icon: ({ crm: "building", hr: "people", pms: "finance", realty: "code" } as const)[p.id] as IconName,
  description: p.overview,
  result: p.benefits[0],
  stats: p.facts,
}));

const capabilities = [
  {
    icon: "code" as IconName,
    title: "Website Design & Development",
    text: "Fast, responsive business websites with content management, inquiry forms and integrations.",
  },
  {
    icon: "spark" as IconName,
    title: "Custom Software Development",
    text: "Web applications designed around your workflow, from first requirement to production.",
  },
  {
    icon: "target" as IconName,
    title: "CRM & Business Management Systems",
    text: "Lead, customer, sales and operations management built around how your team sells.",
  },
  {
    icon: "people" as IconName,
    title: "HRMS & Workforce Management",
    text: "Employee records, attendance, leave, payroll workflows and self-service portals.",
  },
  {
    icon: "chart" as IconName,
    title: "Portfolio & Management Dashboards",
    text: "Clear dashboards and reports that turn operational data into decisions.",
  },
  {
    icon: "layers" as IconName,
    title: "Enterprise Applications",
    text: "Multi-role, multi-branch platforms with approvals, audit trails and access control.",
  },
  {
    icon: "plug" as IconName,
    title: "API & System Integrations",
    text: "Connect your software, payment, email, messaging and data systems so information flows.",
  },
  {
    icon: "pen" as IconName,
    title: "UI/UX Design",
    text: "Interfaces your customers and staff understand quickly, designed and tested before build.",
  },
  {
    icon: "shield" as IconName,
    title: "Application Maintenance & Support",
    text: "Updates, improvements, monitoring and support after go-live as your business grows.",
  },
];

const problems = [
  ["Manual HR operations", "Custom HRMS with employee records, attendance and leave workflows."],
  ["Unorganised customer and sales information", "Custom CRM with lead tracking and customer management."],
  ["Complex management and reporting requirements", "Custom dashboards and management systems."],
  ["An outdated business website", "A professional, responsive website that represents your business well."],
  [
    "Existing software that does not fit your business",
    "Software designed and developed specifically around your workflow.",
  ],
];

const processSteps = [
  ["Requirement Understanding", "We listen to your goals, your process, your people and where work slows down."],
  ["Business Analysis", "We map the workflow, the roles involved and the information each step needs."],
  ["UI/UX Design", "You see and review the screens and user journeys before development starts."],
  ["Architecture & Planning", "We choose the right technology, data model, integrations and delivery plan."],
  ["Software Development", "We build in short cycles so you can review working software early."],
  ["Testing & Quality Assurance", "Every workflow, role and device is tested before release."],
  ["Deployment", "We set up hosting, migrate data where needed and train your team."],
  ["Ongoing Support", "We stay available for fixes, improvements and new features."],
];

const industries = [
  ["Real Estate", "building"],
  ["Financial Management", "finance"],
  ["Corporate Businesses", "layers"],
  ["HR & Recruitment", "people"],
  ["Retail & Sales", "target"],
  ["Startups", "spark"],
  ["SMEs", "workflow"],
  ["Enterprise Organisations", "shield"],
] as [string, IconName][];

function Brand() {
  return (
    <a className="brand" href="#top" aria-label="Parva IT home">
      <span className="brand-emblem"><BrandMark /></span>
      <span className="brand-copy">
        <strong>PARVA IT</strong>
        <small>INFORMATION TECHNOLOGY</small>
      </span>
    </a>
  );
}

/** Static stand-in for a project's interface, shown on phones and while the live demo loads.
 *  It only shows facts taken from the project's source code; there are no invented figures. */
function DashboardPreview({
  product,
  expanded = false,
}: {
  product: (typeof products)[number];
  expanded?: boolean;
}) {
  const bars =
    product.id === "realty"
      ? [32, 54, 43, 72, 65, 91, 78]
      : product.id === "pms"
        ? [25, 40, 38, 60, 58, 79, 87]
        : product.id === "hr"
          ? [44, 49, 52, 58, 64, 68, 76]
          : [72, 78, 76, 83, 88, 91, 96];

  return (
    <div className={`dashboard ${expanded ? "dashboard-expanded" : ""}`}>
      <aside className="dash-sidebar">
        <div className="dash-logo">P</div>
        {[0, 1, 2, 3, 4].map((item) => (
          <span className={item === 0 ? "active" : ""} key={item} />
        ))}
      </aside>
      <div className="dash-main">
        <div className="dash-header">
          <div>
            <small>PARVA IT / {product.short}</small>
            <strong>{product.label}</strong>
          </div>
          <div className="dash-user">{product.number}</div>
        </div>
        <div className="dash-stats">
          {product.stats.map(([value, label]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <small className="neutral">Built in</small>
            </div>
          ))}
        </div>
        <div className="dash-content">
          <div className="dash-chart">
            <div className="dash-section-head">
              <span>Interface preview</span>
              <small>Illustration</small>
            </div>
            <div className="chart-bars">
              {bars.map((height, index) => (
                <i
                  key={index}
                  style={
                    {
                      "--bar-height": `${height}%`,
                      "--delay": `${index * 90}ms`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          </div>
          <div className="dash-activity">
            <div className="dash-section-head">
              <span>Key modules</span>
              <b>DEMO</b>
            </div>
            {product.modules.map((text, index) => (
              <div className="activity-row" key={text}>
                <span>{index + 1}</span>
                <p>
                  {text}
                  <small>Included</small>
                </p>
                <i />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="video-progress">
        <span />
      </div>
    </div>
  );
}

/** The real demo application, scaled down to fit the showcase. Interactive. */
function LiveDemoFrame({ product }: { product: (typeof products)[number] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const DESIGN_WIDTH = 1280;

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / DESIGN_WIDTH);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="live-frame" ref={wrap}>
      {!loaded && (
        <div className="live-frame-placeholder">
          <DashboardPreview product={product} />
        </div>
      )}
      {scale > 0 && (
        <iframe
          title={`${product.title}: live demo`}
          src={product.demoUrl}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          style={{
            width: DESIGN_WIDTH,
            height: 800,
            transform: `scale(${scale})`,
            opacity: loaded ? 1 : 0,
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(0);
  const [videoOpen, setVideoOpen] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InquiryPreset>({});
  const [formKey, setFormKey] = useState(0);
  const [contactPreset, setContactPreset] = useState<InquiryPreset>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach(
          (entry) => entry.isIntersecting && entry.target.classList.add("is-visible"),
        ),
      { threshold: 0.12 },
    );
    document.querySelectorAll(".reveal").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen || videoOpen || inquiryOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, videoOpen, inquiryOpen]);

  useEffect(() => {
    if (!videoOpen && !inquiryOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setVideoOpen(false);
        setInquiryOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [videoOpen, inquiryOpen]);

  const openInquiry = (preset: InquiryPreset = {}) => {
    setSelectedProduct(preset);
    setFormKey((k) => k + 1);
    setInquiryOpen(true);
  };

  /** "Discuss a similar project": pre-fills the Contact section and scrolls to it. */
  const discussSimilar = (item: (typeof products)[number]) => {
    setContactPreset({
      projectInterest: item.interest,
      source: "Portfolio – Discuss similar project",
      requirement: (
        { crm: "CRM System", hr: "HRMS System", pms: "Portfolio / Management Dashboard", realty: "Business Website" } as const
      )[item.id],
    });
    setFormKey((k) => k + 1);
    requestAnimationFrame(() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }));
  };

  const product = products[activeProduct];
  const navItems = [
    ["About", "about"],
    ["What we do", "services"],
    ["Our work", "products"],
    ["Process", "process"],
    ["Contact", "contact"],
  ];

  return (
    <main>
      <header className="site-header">
        <Brand />
        <nav className="desktop-nav" aria-label="Main">
          {navItems.map(([label, href]) => (
            <a key={href} href={`#${href}`}>
              {label}
            </a>
          ))}
        </nav>
        <div className="header-end">
          <a className="nav-signin" href="/admin/login" aria-label="Admin sign in" title="Admin sign in">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="5" y="11" width="14" height="10" rx="1.5" />
              <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
            </svg>
          </a>
          <button className="nav-cta" onClick={() => openInquiry()}>
            Discuss your project <Icon name="arrow" size={17} />
          </button>
        </div>
        <button className="menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Icon name="menu" />
        </button>
      </header>

      <div className={`mobile-menu ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}>
        <button onClick={() => setMenuOpen(false)} aria-label="Close menu">
          <Icon name="x" />
        </button>
        {navItems.map(([label, href]) => (
          <a key={href} href={`#${href}`} onClick={() => setMenuOpen(false)} tabIndex={menuOpen ? 0 : -1}>
            {label}
          </a>
        ))}
        <button
          className="gold-button"
          tabIndex={menuOpen ? 0 : -1}
          onClick={() => {
            setMenuOpen(false);
            openInquiry();
          }}
        >
          Discuss your project <Icon name="arrow" />
        </button>
        <a href="/admin/login" className="mobile-signin" tabIndex={menuOpen ? 0 : -1}>
          Team sign in
        </a>
      </div>

      <section className="hero" id="top">
        <div className="hero-atmosphere" />
        <div className="hero-copy">
          <p className="eyebrow">PARVA IT · CUSTOM SOFTWARE DEVELOPMENT</p>
          <h1 className="hero-title-long">
            Building digital solutions
            <br />
            <em>that move businesses forward.</em>
          </h1>
          <p className="hero-lead">
            Every business has different challenges. We bring the technology, expertise and development
            capabilities to turn those challenges into practical digital solutions.
          </p>
          <div className="hero-actions">
            <a href="#products" className="gold-button">
              Explore our work <Icon name="arrow" />
            </a>
            <button className="outline-button" onClick={() => openInquiry()}>
              Discuss your project <span>→</span>
            </button>
          </div>
          <div className="hero-proof">
            <span>
              <b>01</b> We understand
            </span>
            <span>
              <b>02</b> We design
            </span>
            <span>
              <b>03</b> We build
            </span>
          </div>
        </div>
        <div className="hero-work">
          <p className="hero-work-label">OUR WORK · LIVE DEMOS</p>
          {products.map((product, index) => (
            <a key={product.id} href="#products" className="hero-work-item" onClick={() => setActiveProduct(index)}>
              <span>{product.number}</span>
              <strong>{product.label}</strong>
              <Icon name="arrow" size={16} />
            </a>
          ))}
        </div>
      </section>

      <section className="promise">
        <p className="section-label reveal">OUR APPROACH</p>
        <div className="promise-copy reveal">
          <h2>
            Technology built
            <br />
            <em>around your business.</em>
          </h2>
          <p>
            We turn business requirements into powerful digital solutions. From custom websites and business
            applications to intelligent management platforms, we design and develop technology that works around
            your business.
          </p>
        </div>
      </section>

      <section className="about" id="about">
        <div className="about-intro reveal">
          <p className="section-label gold">ABOUT PARVA IT</p>
          <h2>
            An independent technology company,
            <br />
            <em>focused on your requirements.</em>
          </h2>
        </div>
        <div className="about-grid">
          {[
            [
              "Who we are",
              "Parva IT is an independent IT and technology solutions company and part of Parva Group. We operate as a dedicated software development business serving external clients.",
            ],
            [
              "What we do",
              "We design and develop websites, business applications, management systems, dashboards and integrations that are built for each client rather than sold off the shelf.",
            ],
            [
              "Our capabilities",
              "Our team covers business analysis, UI/UX design, front-end and back-end development, databases, integrations, deployment and ongoing support.",
            ],
            [
              "Our approach",
              "We understand your business first, design the solution with you, then build it in stages you can review. Technology choices follow your needs, not the other way round.",
            ],
            [
              "Our commitment",
              "Every solution is customised to the client’s workflow. We do not limit you to a fixed product list; if you need it, we analyse it and build it.",
            ],
          ].map(([title, text], index) => (
            <article className="about-item reveal" key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="services-head" aria-labelledby="services-title">
        <p className="section-label reveal">WHAT WE DO</p>
        <h2 id="services-title" className="reveal">
          Services and capabilities,
          <br />
          <em>not a fixed product list.</em>
        </h2>
      </section>
      <section className="capabilities capabilities-nine" id="services">
        {capabilities.map((item, index) => (
          <article className="capability reveal" key={item.title}>
            <span className="cap-number">{String(index + 1).padStart(2, "0")}</span>
            <div className="cap-icon">
              <Icon name={item.icon} />
            </div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </section>

      <section className="problems" id="problems">
        <div className="problems-intro reveal">
          <p className="section-label gold">PROBLEMS WE SOLVE</p>
          <h2>
            From business problem
            <br />
            <em>to working software.</em>
          </h2>
        </div>
        <div className="problem-list">
          {problems.map(([problem, solution]) => (
            <article className="problem-row reveal" key={problem}>
              <div>
                <span>PROBLEM</span>
                <h3>{problem}</h3>
              </div>
              <Icon name="arrow" />
              <div>
                <span>SOLUTION</span>
                <p>{solution}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="product-studio" id="products">
        <div className="studio-heading reveal">
          <div>
            <p className="section-label gold">OUR WORK · DEVELOPMENT PORTFOLIO</p>
            <h2>
              What we have
              <br />
              <em>already built.</em>
            </h2>
          </div>
          <p>
            Four projects that show how we work. Each was designed and developed around a specific business
            workflow, and each demo below is the real application running with sample data. They are examples of
            our capability, not the limits of it.
          </p>
        </div>

        <div className="product-tabs reveal" role="tablist" aria-label="Portfolio projects">
          {products.map((item, index) => (
            <button
              className={index === activeProduct ? "active" : ""}
              key={item.id}
              role="tab"
              aria-selected={index === activeProduct}
              onClick={() => setActiveProduct(index)}
            >
              <span>{item.number}</span>
              <div>
                <small>Project {item.number}</small>
                <strong>{item.name}</strong>
              </div>
            </button>
          ))}
        </div>

        <div className="product-showcase" key={product.id} role="tabpanel">
          <div className="product-story">
            <div className="product-symbol">
              <Icon name={product.icon} size={25} />
            </div>
            <p className="section-label gold">PROJECT {product.number} · {product.label}</p>
            <h3>{product.title}</h3>
            <p>{product.description}</p>
            <div className="project-brief">
              <div>
                <span>BUSINESS PROBLEM</span>
                <p>{product.problem}</p>
              </div>
              <div>
                <span>SOLUTION DEVELOPED</span>
                <p>{product.solution}</p>
              </div>
            </div>
            <div className="product-actions">
              <button className="gold-button" onClick={() => setVideoOpen(true)}>
                Explore live demo <Icon name="arrow" />
              </button>
              <button className="watch-button" onClick={() => discussSimilar(product)}>
                <span>
                  <Icon name="arrow" size={16} />
                </span>
                Discuss a similar project
              </button>
            </div>
          </div>
          <div className="preview-wrap">
            <div className="preview-caption">
              <span>
                <i />
                LIVE DEMO · SAMPLE DATA · CLICK TO USE
              </span>
              <a href={product.demoUrl} target="_blank" rel="noopener">
                OPEN IN NEW TAB ↗
              </a>
            </div>
            <LiveDemoFrame product={product} key={product.id} />
            <div className="preview-mobile">
              <DashboardPreview product={product} />
            </div>
          </div>
        </div>

        <div className="project-details" key={`${product.id}-details`}>
          <div>
            <p className="section-label gold">FEATURES IN THE APPLICATION</p>
            <ul className="feature-list">
              {product.features.map((f) => (
                <li key={f}>
                  <Icon name="check" size={16} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="section-label gold">TECHNOLOGY</p>
            <div className="stack-tags">
              {product.stack.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <div className="product-result">
              <span>WHAT IT DELIVERS</span>
              {product.benefits.map((b) => (
                <strong key={b}>{b}</strong>
              ))}
            </div>
            <p className="demo-note">{product.demoLogin}</p>
          </div>
        </div>
      </section>

      <section className="journey" id="process">
        <div className="journey-intro reveal">
          <p className="section-label">CUSTOM DEVELOPMENT SERVICES</p>
          <h2>
            Your requirement.
            <br />
            <em>Our development expertise.</em>
          </h2>
          <p>
            We build completely customised software based on your business requirements. You see, test and
            understand what we are building at every step, from the first conversation to long after go-live.
          </p>
          <button className="gold-button journey-cta" onClick={() => openInquiry()}>
            Start your project <Icon name="arrow" />
          </button>
        </div>
        <div className="journey-steps">
          {processSteps.map(([title, text], index) => (
            <article className="journey-step reveal" key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
              <Icon name="arrow" />
            </article>
          ))}
        </div>
      </section>

      <section className="custom-build">
        <div className="custom-grid" />
        <div className="custom-copy reveal">
          <p className="section-label gold">NOT IN OUR PORTFOLIO?</p>
          <h2>
            Then we build
            <br />
            <em>what does not exist yet.</em>
          </h2>
          <p>
            ERP systems, admin portals, booking platforms, customer portals, automation, industry-specific
            software or a completely new product. Tell us the idea in plain language and we will turn it into a
            clear, working digital solution.
          </p>
          <button className="gold-button" onClick={() => openInquiry()}>
            Start with your idea <Icon name="arrow" />
          </button>
        </div>
      </section>

      <section className="industries" id="industries">
        <div className="industries-head reveal">
          <p className="section-label">INDUSTRIES WE CAN SERVE</p>
          <h2>
            Built for the way
            <br />
            <em>your sector works.</em>
          </h2>
          <p>
            These are markets where our development experience applies. They describe who we can help, not a
            list of existing clients or certifications.
          </p>
        </div>
        <div className="industry-grid">
          {industries.map(([name, icon]) => (
            <div className="industry reveal" key={name}>
              <Icon name={icon} />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="contact" id="contact">
        <div className="contact-copy reveal">
          <p className="section-label gold">CONTACT US</p>
          <h2>
            Tell us what
            <br />
            <em>you need to build.</em>
          </h2>
          <p>
            Share your requirement and our team will get back to you to understand it in detail. There is no
            obligation, and a simple description is enough to start.
          </p>
          <ul className="contact-points">
            <li>
              <Icon name="check" size={16} /> We review every requirement personally
            </li>
            <li>
              <Icon name="check" size={16} /> We suggest the right solution, custom or adapted
            </li>
            <li>
              <Icon name="check" size={16} /> Live demos of our previous work on request
            </li>
          </ul>
        </div>
        <div className="inquiry-modal contact-card reveal">
          <InquiryForm key={`contact-${formKey}`} idPrefix="contact" preset={contactPreset} />
        </div>
      </section>

      <section className="closing">
        <div className="closing-mark">P</div>
        <p className="section-label gold reveal">LET’S BUILD WHAT’S NEXT</p>
        <h2 className="reveal">
          One conversation
          <br />
          can change <em>everything.</em>
        </h2>
        <p className="reveal">
          Show us what is manual, messy, disconnected, or still only an idea. We will show you a better way.
        </p>
        <button className="gold-button reveal" onClick={() => openInquiry()}>
          Speak with the Parva IT team <Icon name="arrow" />
        </button>
      </section>

      <footer>
        <Brand />
        <p>Parva IT is an independent technology company of Parva Group.</p>
        <div className="footer-links">
          <a href="#services">What we do</a>
          <a href="#products">Our work</a>
          <a href="#process">Process</a>
          <a href="#contact">Contact</a>
        </div>
        <small>© {new Date().getFullYear()} PARVA IT. ALL RIGHTS RESERVED.</small>
      </footer>

      {videoOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setVideoOpen(false)}
        >
          <div
            className="video-modal demo-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${product.title}: live demo`}
          >
            <button
              className="modal-close"
              onClick={() => setVideoOpen(false)}
              aria-label="Close demo"
            >
              <Icon name="x" />
            </button>
            <div className="video-title">
              <span>PROJECT {product.number} / LIVE DEMO</span>
              <strong>{product.label}</strong>
            </div>
            <iframe className="demo-modal-frame" title={`${product.title}: live demo`} src={product.demoUrl} />
            <div className="video-narrative">
              <span className="play-state">
                <Icon name="play" size={15} /> SAMPLE DATA
              </span>
              <p>{product.demoLogin}</p>
              <div className="demo-modal-actions">
                <a className="outline-button" href={product.demoUrl} target="_blank" rel="noopener">
                  New tab <Icon name="external" size={15} />
                </a>
                <button
                  className="gold-button"
                  onClick={() => {
                    setVideoOpen(false);
                    discussSimilar(product);
                  }}
                >
                  Discuss a similar project <Icon name="arrow" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {inquiryOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setInquiryOpen(false)}
        >
          <div
            className="inquiry-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inquiry-title"
          >
            <button
              className="modal-close dark"
              onClick={() => setInquiryOpen(false)}
              aria-label="Close form"
            >
              <Icon name="x" />
            </button>
            <p className="section-label gold">START A CONVERSATION</p>
            <h2 id="inquiry-title">Discuss your project</h2>
            <InquiryForm
              key={`modal-${formKey}`}
              idPrefix="modal"
              preset={selectedProduct}
              onDone={() => setInquiryOpen(false)}
            />
          </div>
        </div>
      )}
    </main>
  );
}
