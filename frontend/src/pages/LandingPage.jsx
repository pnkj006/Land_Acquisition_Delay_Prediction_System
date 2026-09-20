import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Bell,
  Brain,
  Check,
  ChevronRight,
  ClipboardList,
  FileText,
  LifeBuoy,
  Lightbulb,
  Menu,
  Radar,
  ShieldCheck,
  X,
} from 'lucide-react'
import Button from '../components/common/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import logo from '../assets/images/logo.png'
import heroImage from '../assets/images/hero-land.jpg'

/**
 * Public landing page. Separate from the Manager Dashboard — it imports no
 * dashboard components and shows no statistics the system does not produce.
 * Nav links are in-page anchors; the only real routes used are the existing
 * /login (via Link) and the dashboard route (via useNavigate).
 */

const NAV_LINKS = [
  { label: 'Home', target: 'top' },
  { label: 'About', target: 'about' },
  { label: 'How It Works', target: 'how-it-works' },
  { label: 'Resources', target: 'resources' },
  { label: 'Help & Support', target: 'contact' },
  { label: 'Contact', target: 'contact' },
]

const FEATURES = [
  { icon: Radar, title: 'Early Delay Detection', text: 'Identify potential delays using data-driven insights.' },
  { icon: ClipboardList, title: 'Project Monitoring', text: 'Track project status, risks and key milestones.' },
  { icon: Bell, title: 'Field Updates', text: 'Capture real-time progress from the field.' },
  { icon: Lightbulb, title: 'Actionable Recommendations', text: 'Get predictive recommendations to support timely corrective action.' },
]

const WORKFLOW = [
  { step: 'Monitor', text: 'Track project data.' },
  { step: 'Analyse', text: 'Analyse risk factors.' },
  { step: 'Identify Risk', text: 'Detect delays early.' },
  { step: 'Take Action', text: 'Enable intervention.' },
  { step: 'Better Outcomes', text: 'Support timely completion.' },
]

/** Capability strip labels — content that already exists in the system, no statistics. */
const CAPABILITIES = ['Early Detection', 'Risk Analysis', 'Field Intelligence', 'Corrective Action']

function scrollToSection(id) {
  if (id === 'top') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

function UtilityBar() {
  return (
    <div className="bg-primary-dark text-[11px] text-primary-100">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-1.5">
        <a href="#main-content" className="hover:text-white">
          Skip to main content
        </a>
        <div className="flex items-center gap-4">
          <span className="cursor-default hover:text-white">Screen Reader Access</span>
          <span className="flex items-center gap-1" aria-hidden="true">
            <button type="button" className="px-1 hover:text-white">A-</button>
            <button type="button" className="px-1 font-semibold hover:text-white">A</button>
            <button type="button" className="px-1 hover:text-white">A+</button>
          </span>
          <span className="rounded-sm bg-white/10 px-1.5 py-0.5">English</span>
        </div>
      </div>
    </div>
  )
}

function Navbar({ onDashboard }) {
  const [open, setOpen] = useState(false)
  const go = (target) => {
    setOpen(false)
    scrollToSection(target)
  }
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3" aria-label="Main navigation">
        <a href="#top" className="flex items-center gap-2.5" onClick={(e) => { e.preventDefault(); go('top') }}>
          <img src={logo} alt="System logo" className="h-9 w-9 rounded-lg" />
          <span className="leading-tight">
            <span className="block text-[13px] font-bold text-primary">SANKET</span>
            <span className="block text-[10px] font-medium text-gray-500">Land Acquisition Delay Predictor</span>
          </span>
        </a>
        <ul className="hidden items-center gap-6 text-[13px] font-medium text-gray-600 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={`#${link.target}`}
                onClick={(e) => { e.preventDefault(); go(link.target) }}
                className="transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden items-center gap-1 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-primary-dark sm:inline-flex"
          >
            Login <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg border border-gray-200 p-2 text-gray-600 lg:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>
      {open ? (
        <div className="border-t border-gray-100 bg-white px-4 py-3 lg:hidden">
          <ul className="flex flex-col gap-1 text-sm text-gray-700">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <button
                  type="button"
                  onClick={() => go(link.target)}
                  className="w-full rounded-md px-2 py-2 text-left transition-colors hover:bg-primary-50"
                >
                  {link.label}
                </button>
              </li>
            ))}
            <li className="mt-2">
              <Button onClick={onDashboard} fullWidth>
                Login <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </li>
          </ul>
        </div>
      ) : null}
    </header>
  )
}

function Hero({ onDashboard }) {
  return (
    <section className="bg-primary-50/60">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-2 lg:gap-10 lg:py-12">
        <div className="animate-fade-in">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            Land · People · Progress
          </p>
          <h1 className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
            Timely Land Acquisition.
            <br />
            <span className="text-primary">For a Better Tomorrow.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-600">
            A data-driven platform to monitor land acquisition projects, identify potential
            delays early, enable coordinated action, and support timely and transparent
            development.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button onClick={onDashboard} size="lg">
              Explore the System <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => scrollToSection('about')}>
              Learn More
            </Button>
          </div>
        </div>
        {/* Integrated composition: soft shadow + gentle gradient fade toward the
            text + one quiet decorative block behind the frame. */}
        <div className="relative">
          <div className="absolute -bottom-3 -left-3 hidden h-20 w-20 rounded-2xl bg-primary-100/70 lg:block" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-2xl border border-primary-100 shadow-lg ring-1 ring-primary-100/50">
            <img
              src={heroImage}
              alt="Rural farmland landscape representing land acquisition and development"
              className="h-56 w-full object-cover sm:h-72 lg:h-[360px]"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary-50/40 via-transparent to-transparent"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

/** Compact capability strip — reinforces the system's purpose without statistics. */
function CapabilityStrip() {
  return (
    <section aria-label="System capabilities" className="border-b border-primary-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-gray-500 sm:justify-between lg:px-8">
        {CAPABILITIES.map((capability, index) => (
          <span key={capability} className="flex items-center gap-3">
            <span className="transition-colors hover:text-primary">{capability}</span>
            {index < CAPABILITIES.length - 1 ? (
              <ChevronRight className="h-3.5 w-3.5 text-primary/40" aria-hidden="true" />
            ) : null}
          </span>
        ))}
      </div>
    </section>
  )
}

function Features() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
        System Capabilities
      </p>
      <h2 className="mt-1 text-lg font-bold text-gray-800">What the system does</h2>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <article
            key={feature.title}
            className="group rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-100 hover:shadow-md"
          >
            <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary transition-transform duration-200 group-hover:scale-110">
              <feature.icon className="h-[18px] w-[18px]" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">{feature.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">{feature.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-primary-dark py-10 text-white">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-100">
          How It Works
        </p>
        <h2 className="mt-1 text-xl font-bold">Building a More Inclusive Future</h2>
        <p className="mt-2 max-w-xl text-sm text-primary-100">
          Transparent, efficient and people-centered land acquisition for infrastructure,
          industry and community development.
        </p>
        <ol className="mt-6 flex flex-col gap-2 lg:flex-row lg:items-stretch">
          {WORKFLOW.map((stage, index) => (
            <li key={stage.step} className="flex items-stretch gap-1.5 lg:flex-1 lg:gap-0">
              <div className="flex-1 rounded-xl border border-white/10 bg-white/5 p-3.5 transition-colors duration-200 hover:border-primary-100/40 hover:bg-white/10">
                <p className="text-[11px] font-bold tabular-nums text-primary-100">
                  0{index + 1}
                </p>
                <h3 className="mt-0.5 text-sm font-semibold">{stage.step}</h3>
                <p className="mt-0.5 text-[11px] leading-relaxed text-primary-100">{stage.text}</p>
              </div>
              {index < WORKFLOW.length - 1 ? (
                <div className="hidden items-center px-0.5 lg:flex" aria-hidden="true">
                  <ChevronRight className="h-4 w-4 text-primary-100/70" />
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function ImportantInfo() {
  const links = [
    { label: 'Guidelines & Policies', icon: FileText },
    { label: 'Notifications', icon: Bell },
    { label: 'Help & Support', icon: LifeBuoy, target: 'contact' },
  ]
  return (
    <section id="resources" className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Important Information</h2>
          <p className="mt-1 max-w-md text-sm text-gray-500">
            Access guidelines, notifications and resources related to land acquisition.
          </p>
        </div>
        <ul className="flex flex-wrap gap-2">
          {links.map((link) => {
            const chipClass =
              'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors'
            const content = (
              <>
                <link.icon className="h-3.5 w-3.5" aria-hidden="true" />
                {link.label}
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
              </>
            )
            return (
              <li key={link.label}>
                {link.target ? (
                  <button
                    type="button"
                    onClick={() => scrollToSection(link.target)}
                    className={`${chipClass} border border-primary-100 bg-primary-50 text-primary hover:bg-primary-100`}
                  >
                    {content}
                  </button>
                ) : (
                  <span className={`${chipClass} cursor-default border border-gray-100 bg-gray-50 text-gray-500`}>
                    {content}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

/* ---------- About capability-box concept visuals (no real statistics —
   each communicates the CONCEPT of its module, as required) ---------- */

function RiskLevelMeter() {
  const levels = [
    { label: 'LOW', dot: 'bg-risk-low' },
    { label: 'MEDIUM', dot: 'bg-risk-medium' },
    { label: 'HIGH', dot: 'bg-risk-high' },
  ]
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      {levels.map((level) => (
        <span key={level.label} className="flex items-center gap-1 text-[9px] font-semibold text-gray-500">
          <span className={`h-1.5 w-1.5 rounded-full ${level.dot}`} />
          {level.label}
        </span>
      ))}
    </div>
  )
}

function FactorBars() {
  const factors = [
    { label: 'Legal Disputes', width: 'w-3/5' },
    { label: 'Compensation', width: 'w-2/5' },
    { label: 'Approval Delay', width: 'w-1/3' },
  ]
  return (
    <ul aria-hidden="true">
      {factors.map((factor) => (
        <li key={factor.label} className="flex items-center gap-2 py-0.5">
          <span className="w-[88px] shrink-0 text-[10px] leading-none text-gray-500">{factor.label}</span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
            <span className={`block h-full rounded-full bg-primary/50 ${factor.width}`} />
          </span>
        </li>
      ))}
    </ul>
  )
}

function FieldProgress() {
  return (
    <div aria-hidden="true">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">Field update</p>
      <div className="relative mt-2 h-1 w-full rounded-full bg-gray-100">
        <span className="absolute left-[60%] top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-white" />
      </div>
      <p className="mt-1.5 text-[10px] text-gray-400">Updated from field</p>
    </div>
  )
}

function RecommendationPreview() {
  return (
    <ul aria-hidden="true" className="flex flex-col gap-1">
      {[
        'Review compensation documentation',
        'Assign additional field officers',
      ].map((label) => (
        <li key={label} className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <Check className="h-3 w-3 shrink-0 text-green-600" aria-hidden="true" />
          {label}
        </li>
      ))}
    </ul>
  )
}

function AlertPreview() {
  return (
    <ul aria-hidden="true" className="flex flex-col gap-1">
      <li className="flex items-center gap-1.5 text-[10px]">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-risk-high" />
        <span className="font-medium text-gray-600">High Risk Project</span>
      </li>
      <li className="flex items-center gap-1.5 text-[10px]">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
        <span className="font-medium text-gray-600">Delay Detected</span>
      </li>
    </ul>
  )
}

function AnalyticsTrend() {
  return (
    <div aria-hidden="true" className="flex items-end gap-0.5">
      <span className="block h-4 w-1 rounded-sm bg-primary/60" />
      <span className="block h-6 w-1 rounded-sm bg-primary/70" />
      <span className="block h-8 w-1 rounded-sm bg-primary/80" />
      <span className="block h-10 w-1 rounded-sm bg-primary/90" />
      <span className="block h-7 w-1 rounded-sm bg-primary/70" />
      <span className="text-[9px] leading-none text-gray-400">Delay trend</span>
    </div>
  )
}

/**
 * Reusable box for the About-section capability grid. Each box is a
 * miniature preview: icon + title + one-line description + a concept-only
 * visual element that shows what the module communicates — never real
 * statistics.
 */
function CapabilityBox({ icon: Icon, title, text, visual }) {
  return (
    <li className="group flex h-full flex-col gap-2.5 rounded-xl border border-primary-100 bg-white p-4 shadow-sm transition-colors duration-200 hover:border-primary hover:shadow-md">
      <div className="flex items-start gap-2.5">
        <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <p className="text-[11px] leading-relaxed text-gray-600">{text}</p>
      <div className="mt-auto">{visual}</div>
    </li>
  )
}

function About() {
  // Six capability boxes — each is a miniature preview that communicates
  // the concept of its corresponding system module. The visuals are
  // concept-only (no statistics), as required.
  const capabilities = [
    {
      icon: ShieldCheck,
      title: 'Predictive Risk Analysis',
      text: 'Identify projects at risk of delay before issues become critical.',
      visual: <RiskLevelMeter />,
    },
    {
      icon: Brain,
      title: 'Explainable AI',
      text: "Understand the key factors contributing to each project's risk.",
      visual: <FactorBars />,
    },
    {
      icon: ClipboardList,
      title: 'Field Updates',
      text: 'Capture project progress and real-world updates from the field.',
      visual: <FieldProgress />,
    },
    {
      icon: Lightbulb,
      title: 'Actionable Recommendations',
      text: 'Receive corrective actions based on project risks and progress.',
      visual: <RecommendationPreview />,
    },
    {
      icon: Bell,
      title: 'Alerts',
      text: 'Receive timely notifications when projects require attention.',
      visual: <AlertPreview />,
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      text: 'Analyse project, district and delay trends for better decisions.',
      visual: <AnalyticsTrend />,
    },
  ]

  return (
    <section id="about" className="bg-primary-50/60 py-10 sm:py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            About the System
          </p>
          <h2 className="mt-1 text-lg font-bold text-gray-800">
            Built for timely, transparent land acquisition
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-gray-600">
            The Land Acquisition Delay Monitoring System is designed to help project managers
            monitor acquisition progress, identify potential delay risks, understand
            contributing factors, and take timely corrective action.
          </p>
        </div>
        <ul className="mt-6 grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          {capabilities.map((cap) => (
            <CapabilityBox
              key={cap.title}
              icon={cap.icon}
              title={cap.title}
              text={cap.text}
              visual={cap.visual}
            />
          ))}
        </ul>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer id="contact" className="bg-primary-dark text-primary-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="" className="h-9 w-9 rounded-lg" />
            <p className="leading-tight">
              <span className="block text-sm font-bold text-white">SANKET</span>
            </p>
          </div>
          <p className="mt-3 text-xs">Land Acquisition Delay Predictor</p>
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
          {['Privacy Policy', 'Terms of Use', 'Accessibility', 'Sitemap', 'Contact'].map((label) => (
            <li key={label}>
              <span className="cursor-default hover:text-white">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  // Routing-only: keep an already-signed-in Administrator inside the Admin
  // namespace; PMs keep the existing /dashboard destination. No UI change.
  const handleDashboard = () => {
    if (isAuthenticated && (user?.roleKey === 'admin' || user?.role === 'Administrator')) {
      navigate('/admin/dashboard')
    } else {
      navigate('/dashboard')
    }
  }
  return (
    <div id="top" className="min-h-screen bg-white font-sans text-gray-800">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-1.5 focus:text-xs focus:text-white"
      >
        Skip to main content
      </a>
      <UtilityBar />
      <Navbar onDashboard={handleDashboard} />
      <main id="main-content">
        <Hero onDashboard={handleDashboard} />
        <CapabilityStrip />
        <Features />
        <HowItWorks />
        <ImportantInfo />
        <About />
      </main>
      <Footer />
    </div>
  )
}



