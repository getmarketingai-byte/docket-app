import type { Metadata } from 'next';
import Link from 'next/link';
import {
  FileText,
  Upload,
  Sparkles,
  BarChart3,
  Search,
  Download,
  CheckCircle2,
  Car,
  Briefcase,
  Truck,
  Wrench,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Docket — AI Receipt Scanner & Expense Tracker for Australian Taxpayers',
  description:
    'Docket scans your receipts with AI, categorises expenses for Australian tax deductions, and exports clean reports. Built for freelancers, sole traders, and contractors.',
  keywords: [
    'receipt scanner australia',
    'expense tracker sole trader',
    'tax deduction tracker',
    'AI receipt scanner',
    'australian tax expenses',
    'freelancer expense tracker',
  ],
  openGraph: {
    title: 'Docket — AI Receipt Scanner & Expense Tracker for Australian Taxpayers',
    description:
      'Scan receipts, track expenses, and stay tax-ready. AI-powered receipt intelligence built for the Australian market.',
    url: 'https://docket.com.au',
    siteName: 'Docket',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Docket — AI Receipt Scanner',
      },
    ],
    locale: 'en_AU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Docket — AI Receipt Scanner & Expense Tracker for Australian Taxpayers',
    description:
      'Scan receipts, track expenses, and stay tax-ready. AI-powered receipt intelligence built for the Australian market.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Docket',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web, iOS, Android',
  description:
    'AI-powered receipt scanner and expense tracker for Australian taxpayers. Automatically categorises expenses for tax deductions.',
  offers: [
    {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'AUD',
      name: 'Free',
    },
    {
      '@type': 'Offer',
      price: '12',
      priceCurrency: 'AUD',
      name: 'Pro',
      billingIncrement: 'month',
    },
  ],
  audience: {
    '@type': 'Audience',
    audienceType: 'Freelancers, sole traders, contractors, small business owners',
  },
  featureList: [
    'AI receipt scanning',
    'Automatic expense categorisation',
    'Australian tax deduction tracking',
    'Bulk upload',
    'Search and filter',
    'CSV and PDF export',
  ],
};

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Upload your receipts',
    description:
      'Snap a photo or drag and drop. Docket accepts photos, PDFs, and screenshots from any device.',
  },
  {
    number: '02',
    icon: Sparkles,
    title: 'AI processes everything',
    description:
      'Our AI extracts merchant, amount, date, and category — and flags potential tax deductions automatically.',
  },
  {
    number: '03',
    icon: BarChart3,
    title: 'Get clear insights',
    description:
      'Browse your expense timeline, filter by category, and export tax-ready reports in seconds.',
  },
];

const features = [
  {
    icon: Sparkles,
    title: 'AI-powered scanning',
    description:
      'Claude Vision reads your receipts and extracts every detail — merchant, ABN, amount, GST, and category.',
  },
  {
    icon: FileText,
    title: 'Australian tax awareness',
    description:
      'Knows Australian tax categories: work-from-home, vehicle, tools, professional development, and more.',
  },
  {
    icon: Upload,
    title: 'Bulk upload',
    description:
      'Upload dozens of receipts at once. Drag a folder straight onto the page and we handle the rest.',
  },
  {
    icon: Search,
    title: 'Instant search',
    description:
      'Find any receipt by merchant, amount, date, or category. Search across your entire history in milliseconds.',
  },
  {
    icon: Download,
    title: 'Export reports',
    description:
      'Generate CSV or PDF summaries ready for your accountant or BAS lodgement. Filtered by date or category.',
  },
  {
    icon: CheckCircle2,
    title: 'Audit-ready records',
    description:
      'All original images stored securely. Every extraction logged. Built for ATO substantiation requirements.',
  },
];

const personas = [
  {
    icon: Briefcase,
    title: 'Freelancers & consultants',
    description:
      'Track client expenses, subscriptions, and home-office costs without spreadsheet hell.',
  },
  {
    icon: Wrench,
    title: 'Tradies & contractors',
    description: 'Capture tool receipts on-site, log vehicle expenses, and export for your BAS.',
  },
  {
    icon: Car,
    title: 'Rideshare & delivery drivers',
    description:
      'Track fuel, maintenance, and work-related vehicle costs throughout the financial year.',
  },
  {
    icon: Truck,
    title: 'Small business owners',
    description:
      'Keep business and personal expenses separate, and give your accountant clean records at year-end.',
  },
];

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started with no commitment.',
    features: [
      'Up to 30 receipts/month',
      'AI scanning & categorisation',
      'Search & timeline',
      'Basic CSV export',
    ],
    cta: 'Get started free',
    href: '/sign-up',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: 'per month',
    description: 'For freelancers and sole traders who need more.',
    features: [
      'Unlimited receipts',
      'Bulk upload',
      'Full PDF & CSV exports',
      'Tax category reports',
      'Priority AI processing',
    ],
    cta: 'Start free trial',
    href: '/sign-up',
    highlighted: true,
    badge: 'Most popular',
  },
  {
    name: 'Business',
    price: '$29',
    period: 'per month',
    description: 'For teams and growing businesses.',
    features: [
      'Everything in Pro',
      'Up to 5 team members',
      'Multi-entity support',
      'Accountant sharing',
      'API access',
      'Priority support',
    ],
    cta: 'Contact us',
    href: '/sign-up',
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="flex min-h-screen flex-col">
        {/* Navigation */}
        <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
          <nav
            className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3"
            aria-label="Main navigation"
          >
            <Link href="/" className="flex items-center gap-2" aria-label="Docket home">
              <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
              <span className="text-lg font-bold tracking-tight">Docket</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/sign-in"
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
              >
                Sign in
              </Link>
              <Link href="/sign-up" className={cn(buttonVariants({ size: 'sm' }))}>
                Get started free
              </Link>
            </div>
          </nav>
        </header>

        <main>
          {/* Hero Section */}
          <section
            className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background pt-20 pb-24"
            aria-labelledby="hero-heading"
          >
            <div className="mx-auto max-w-6xl px-4 text-center">
              <Badge variant="secondary" className="mb-6 text-xs font-medium">
                Built for the Australian market
              </Badge>
              <h1
                id="hero-heading"
                className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
              >
                Your receipts,{' '}
                <span className="text-primary">finally sorted.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
                Docket uses AI to scan receipts, track tax-deductible expenses, and generate
                reports — so you spend less time on paperwork and more time on your business.
              </p>
              <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link href="/sign-up" className={cn(buttonVariants({ size: 'lg' }), 'px-8')}>
                  Get started — it&apos;s free
                </Link>
                <Link
                  href="#how-it-works"
                  className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
                >
                  See how it works
                </Link>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                No credit card required · Free plan available
              </p>

              {/* App preview illustration */}
              <div className="mt-16 mx-auto max-w-4xl">
                <div className="rounded-2xl border bg-card shadow-2xl overflow-hidden">
                  <div className="border-b bg-muted/40 px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-400/60" />
                      <div className="h-3 w-3 rounded-full bg-yellow-400/60" />
                      <div className="h-3 w-3 rounded-full bg-green-400/60" />
                    </div>
                    <div className="mx-auto h-5 w-48 rounded bg-muted text-xs flex items-center justify-center text-muted-foreground">
                      app.docket.com.au
                    </div>
                  </div>
                  <div className="p-6 bg-background">
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium">Officeworks — Printer Ink</p>
                            <p className="text-xs text-muted-foreground">Office supplies · 12 May 2025</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">$47.99</p>
                          <Badge variant="secondary" className="text-xs">Tax deductible</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md bg-blue-500/10 flex items-center justify-center">
                            <Car className="h-5 w-5 text-blue-500" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium">BP Service Station</p>
                            <p className="text-xs text-muted-foreground">Vehicle · 10 May 2025</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">$92.40</p>
                          <Badge variant="secondary" className="text-xs">Tax deductible</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md bg-green-500/10 flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-green-500" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium">Zoom Pro Subscription</p>
                            <p className="text-xs text-muted-foreground">Software · 8 May 2025</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">$24.99</p>
                          <Badge variant="secondary" className="text-xs">Tax deductible</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 rounded-lg border bg-muted/30 p-3 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total deductible this month</span>
                      <span className="text-sm font-bold text-primary">$1,284.50</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section
            id="how-it-works"
            className="py-24 bg-muted/20"
            aria-labelledby="how-it-works-heading"
          >
            <div className="mx-auto max-w-6xl px-4">
              <div className="text-center mb-16">
                <h2
                  id="how-it-works-heading"
                  className="text-3xl font-bold tracking-tight sm:text-4xl"
                >
                  From receipt to insight in seconds
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                  No manual data entry. No spreadsheets. Just scan and go.
                </p>
              </div>
              <ol className="grid gap-8 md:grid-cols-3" aria-label="How Docket works">
                {steps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <li key={step.number} className="relative flex flex-col items-center text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-5">
                        <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
                      </div>
                      <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-2">
                        Step {step.number}
                      </span>
                      <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {step.description}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>

          {/* Features */}
          <section className="py-24" aria-labelledby="features-heading">
            <div className="mx-auto max-w-6xl px-4">
              <div className="text-center mb-16">
                <h2
                  id="features-heading"
                  className="text-3xl font-bold tracking-tight sm:text-4xl"
                >
                  Everything you need to stay tax-ready
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                  Purpose-built for Australian sole traders, freelancers, and small businesses.
                </p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <Card key={feature.title} className="border bg-card">
                      <CardHeader className="pb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                          <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                        </div>
                        <h3 className="font-semibold">{feature.title}</h3>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Who It's For */}
          <section
            className="py-24 bg-muted/20"
            aria-labelledby="who-its-for-heading"
          >
            <div className="mx-auto max-w-6xl px-4">
              <div className="text-center mb-16">
                <h2
                  id="who-its-for-heading"
                  className="text-3xl font-bold tracking-tight sm:text-4xl"
                >
                  Made for how Australians work
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                  Whether you&apos;re invoicing clients, driving for Uber, or running a small crew —
                  Docket keeps your receipts in order.
                </p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {personas.map((persona) => {
                  const Icon = persona.icon;
                  return (
                    <div
                      key={persona.title}
                      className="flex flex-col items-center text-center p-6 rounded-2xl border bg-card"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                        <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                      </div>
                      <h3 className="font-semibold mb-2">{persona.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {persona.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="py-24" aria-labelledby="pricing-heading">
            <div className="mx-auto max-w-6xl px-4">
              <div className="text-center mb-16">
                <h2
                  id="pricing-heading"
                  className="text-3xl font-bold tracking-tight sm:text-4xl"
                >
                  Simple, transparent pricing
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                  Start free. Upgrade when you need more. All prices in AUD, GST-inclusive.
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-3 items-start">
                {pricingPlans.map((plan) => (
                  <Card
                    key={plan.name}
                    className={cn(
                      'relative flex flex-col',
                      plan.highlighted && 'border-primary ring-2 ring-primary shadow-lg'
                    )}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="px-3 py-1 text-xs">{plan.badge}</Badge>
                      </div>
                    )}
                    <CardHeader className="pb-4">
                      <h3 className="text-lg font-bold">{plan.name}</h3>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-extrabold">{plan.price}</span>
                        <span className="text-sm text-muted-foreground">/{plan.period}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1 gap-4">
                      <ul className="space-y-2 flex-1" aria-label={`${plan.name} plan features`}>
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm">
                            <CheckCircle2
                              className="h-4 w-4 text-primary shrink-0"
                              aria-hidden="true"
                            />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={plan.href}
                        className={cn(
                          buttonVariants({
                            variant: plan.highlighted ? 'default' : 'outline',
                            size: 'default',
                          }),
                          'w-full mt-2'
                        )}
                      >
                        {plan.cta}
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground mt-8">
                Billing not yet active — sign up now and lock in early-access pricing.
              </p>
            </div>
          </section>

          {/* Final CTA */}
          <section
            className="py-24 bg-primary text-primary-foreground"
            aria-labelledby="cta-heading"
          >
            <div className="mx-auto max-w-3xl px-4 text-center">
              <h2 id="cta-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
                Stop chasing receipts. Start using Docket.
              </h2>
              <p className="mt-4 text-lg opacity-90">
                Join Australian freelancers and sole traders who keep their expenses organised
                year-round.
              </p>
              <Link
                href="/sign-up"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'mt-10 bg-white text-primary hover:bg-white/90 px-10'
                )}
              >
                Get started free
              </Link>
              <p className="mt-4 text-sm opacity-70">No credit card required</p>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t bg-muted/30 py-12" role="contentinfo">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-10">
              <div>
                <Link href="/" className="flex items-center gap-2 mb-3" aria-label="Docket home">
                  <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="font-bold">Docket</span>
                </Link>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  AI receipt intelligence for the Australian market.
                </p>
              </div>
              <nav aria-label="Product links">
                <h3 className="text-sm font-semibold mb-3">Product</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="#how-it-works" className="hover:text-foreground transition-colors">How it works</Link></li>
                  <li><Link href="#pricing-heading" className="hover:text-foreground transition-colors">Pricing</Link></li>
                  <li><Link href="/sign-up" className="hover:text-foreground transition-colors">Sign up</Link></li>
                </ul>
              </nav>
              <nav aria-label="Company links">
                <h3 className="text-sm font-semibold mb-3">Company</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><span className="cursor-default">About</span></li>
                  <li><span className="cursor-default">Blog</span></li>
                  <li><span className="cursor-default">Contact</span></li>
                </ul>
              </nav>
              <nav aria-label="Legal links">
                <h3 className="text-sm font-semibold mb-3">Legal</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><span className="cursor-default">Privacy Policy</span></li>
                  <li><span className="cursor-default">Terms of Service</span></li>
                </ul>
              </nav>
            </div>
            <Separator className="mb-6" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
              <p>© {new Date().getFullYear()} Docket. All rights reserved.</p>
              <p className="max-w-md text-center sm:text-right">
                <strong>Tax disclaimer:</strong> AI estimates only — consult your accountant for
                advice specific to your situation. Docket does not provide legal, financial, or
                taxation advice.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
