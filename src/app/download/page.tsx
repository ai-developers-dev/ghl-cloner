import Link from 'next/link';

const installSteps = [
  {
    number: 1,
    title: 'Download the Extension',
    description: 'Click the download button above to get the HLExtras extension ZIP file.',
    icon: '📥',
  },
  {
    number: 2,
    title: 'Extract the ZIP File',
    description: 'Locate the downloaded file and extract/unzip it to a folder on your computer.',
    icon: '📂',
  },
  {
    number: 3,
    title: 'Open Chrome Extensions',
    description: 'Open Chrome and go to chrome://extensions or click Menu → More Tools → Extensions.',
    icon: '🌐',
  },
  {
    number: 4,
    title: 'Enable Developer Mode',
    description: 'Toggle the "Developer mode" switch in the top right corner of the extensions page.',
    icon: '🔧',
  },
  {
    number: 5,
    title: 'Load the Extension',
    description: 'Click "Load unpacked" button and select the extracted folder containing the extension.',
    icon: '📦',
  },
  {
    number: 6,
    title: 'Enter Your License Key',
    description: 'Click the HLExtras icon in your toolbar and enter your license key to activate.',
    icon: '🔑',
  },
];

const faqs = [
  {
    question: "Where do I find my license key?",
    answer: "Your license key was sent to your email after purchase. Check your inbox (and spam folder) for an email from HLExtras. You can also find it on your purchase confirmation page.",
  },
  {
    question: "The extension isn't showing in my toolbar",
    answer: "Click the puzzle piece icon in Chrome's toolbar, find HLExtras, and click the pin icon to keep it visible.",
  },
  {
    question: "I get an error when loading the extension",
    answer: "Make sure you extracted the ZIP file first and selected the correct folder. The folder should contain a manifest.json file.",
  },
  {
    question: "Will my license work on multiple computers?",
    answer: "Yes, your license key can be used on multiple computers, but credits are shared across all installations.",
  },
];

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero Section */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-sm mb-8">
            <span>🔧</span> Manual Installation Guide
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Download{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
              HLExtras
            </span>{' '}
            Extension
          </h1>
          <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">
            Get the Chrome extension and start cloning GHL pages in seconds. Follow the simple installation steps below.
          </p>

          {/* Download Button */}
          <a
            href="/downloads/hlextras-extension.zip"
            download
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-semibold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-shadow"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Extension (ZIP)
          </a>

          {/* Chrome Web Store Coming Soon */}
          <div className="mt-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-500">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-3.952 6.848a12.014 12.014 0 0 0 9.298-9.298H15.273zM12 8.182a3.818 3.818 0 1 0 0 7.636 3.818 3.818 0 0 0 0-7.636z" />
              </svg>
              <span>Chrome Web Store - Coming Soon</span>
            </div>
          </div>
        </div>
      </section>

      {/* Installation Steps */}
      <section className="py-16 px-4 bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Installation Steps</h2>
          <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
            Follow these steps to install the HLExtras Chrome extension manually.
          </p>

          <div className="grid gap-6">
            {installSteps.map((step) => (
              <div
                key={step.number}
                className="flex items-start gap-6 bg-slate-900 border border-slate-800 rounded-xl p-6"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-2xl">{step.icon}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-emerald-400 font-bold">Step {step.number}</span>
                    <h3 className="font-semibold text-lg">{step.title}</h3>
                  </div>
                  <p className="text-slate-400">{step.description}</p>
                  {step.number === 3 && (
                    <div className="mt-3">
                      <code className="px-3 py-1.5 bg-slate-800 rounded-lg text-emerald-400 text-sm">
                        chrome://extensions
                      </code>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Tutorial Placeholder */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Video Tutorial Coming Soon</h3>
            <p className="text-slate-400">
              We&apos;re working on a video walkthrough to make installation even easier.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-slate-900/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6"
              >
                <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                <p className="text-slate-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Don&apos;t Have a License Yet?</h2>
          <p className="text-slate-400 mb-8">
            Get your license key to start cloning GHL pages. No subscriptions - just pay for the credits you need.
          </p>
          <Link
            href="/cloner"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-semibold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-shadow"
          >
            Get Your License Key
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 font-bold text-sm">
              HE
            </div>
            <span className="font-bold">HLExtras</span>
          </div>
          <div className="flex gap-6 items-center">
            <a href="#" className="text-slate-500 text-sm hover:text-slate-300">Privacy</a>
            <a href="#" className="text-slate-500 text-sm hover:text-slate-300">Terms</a>
            <a href="#" className="text-slate-500 text-sm hover:text-slate-300">Contact</a>
          </div>
          <div className="text-slate-500 text-sm">© 2024 HLExtras. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
