import ToolCard from '@/components/ToolCard';
import Link from 'next/link';
import Footer from '@/components/Footer';

const tools = [
  {
    icon: '📋',
    title: 'Page Cloner',
    description: 'Clone any GoHighLevel page in seconds. Copy funnels, websites, and landing pages with one click.',
    status: 'available' as const,
    href: '/cloner',
  },
  {
    icon: '📞',
    title: 'Contact Buttons',
    description: 'Add floating contact buttons to any GHL page. Phone, SMS, WhatsApp, and more.',
    status: 'coming-soon' as const,
  },
  {
    icon: '🗺️',
    title: 'Google Maps',
    description: 'Embed interactive Google Maps on your GHL pages with custom styling and markers.',
    status: 'coming-soon' as const,
  },
  {
    icon: '🏠',
    title: 'Zillow Links',
    description: 'Add property links and Zillow integration for real estate funnels and websites.',
    status: 'coming-soon' as const,
  },
  {
    icon: '📱',
    title: 'Dialer',
    description: 'Click-to-call functionality with tracking and analytics for your GHL pages.',
    status: 'coming-soon' as const,
  },
  {
    icon: '✨',
    title: 'More Coming',
    description: "We're constantly building new tools to help GHL agencies save time and grow faster.",
    status: 'coming-soon' as const,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-sm mb-8">
            <span>🚀</span> Professional GHL Extensions
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            GHL Tools That{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
              Save You Hours
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Professional GoHighLevel extensions for agencies. Clone pages, add contact buttons, embed maps, and more.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/cloner"
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-semibold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-shadow"
            >
              Try Page Cloner →
            </Link>
            <a
              href="#tools"
              className="px-8 py-4 bg-slate-800 border border-slate-700 rounded-xl font-semibold text-lg hover:bg-slate-700 transition-colors"
            >
              View All Tools
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 px-4 border-y border-slate-800 bg-slate-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-emerald-400">10,000+</div>
              <div className="text-slate-500 text-sm">Pages Cloned</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400">500+</div>
              <div className="text-slate-500 text-sm">Happy Agencies</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400">6</div>
              <div className="text-slate-500 text-sm">Powerful Tools</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid Section */}
      <section id="tools" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Tools</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Everything you need to supercharge your GoHighLevel workflow. More tools launching soon.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool, index) => (
              <ToolCard
                key={index}
                icon={tool.icon}
                title={tool.title}
                description={tool.description}
                status={tool.status}
                href={tool.href}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Save Hours?</h2>
          <p className="text-slate-400 mb-8">
            Start with our Page Cloner - the fastest way to copy any GHL page. No subscriptions, just buy credits when you need them.
          </p>
          <Link
            href="/cloner"
            className="inline-flex px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-semibold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-shadow"
          >
            Get Started with Page Cloner →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
