import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Privacy Policy | HLExtras',
  description: 'Privacy Policy for HLExtras - Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <nav className="border-b border-slate-800 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 font-bold">
              HE
            </div>
            <span className="font-bold text-lg">HLExtras</span>
          </Link>
          <Link
            href="/"
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-slate-400 mb-8">Last updated: December 11, 2024</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-slate-300 leading-relaxed">
              HLExtras (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the HLExtras website and Chrome extension.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you
              use our services, including the HL Cloner Chrome extension and our website at hlextras.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Information We Collect</h2>

            <h3 className="text-lg font-medium text-white mt-4 mb-2">Personal Information</h3>
            <p className="text-slate-300 leading-relaxed mb-4">
              When you create an account or make a purchase, we collect:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>Name and email address</li>
              <li>Payment information (processed securely by Stripe)</li>
              <li>License key and account credentials</li>
            </ul>

            <h3 className="text-lg font-medium text-white mt-4 mb-2">Usage Information</h3>
            <p className="text-slate-300 leading-relaxed mb-4">
              When you use our Chrome extension, we collect:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>License key validation requests</li>
              <li>Credit usage (number of pages cloned)</li>
              <li>Extension version information</li>
            </ul>

            <h3 className="text-lg font-medium text-white mt-4 mb-2">What We Do NOT Collect</h3>
            <p className="text-slate-300 leading-relaxed mb-4">
              We do not collect:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>The content of pages you clone</li>
              <li>Your browsing history</li>
              <li>URLs of pages you visit (other than GoHighLevel domains during cloning)</li>
              <li>Any personal data from the pages you clone</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>Process your purchases and manage your account</li>
              <li>Validate your license key and track credit usage</li>
              <li>Provide customer support</li>
              <li>Send important updates about our services</li>
              <li>Improve our products and services</li>
              <li>Prevent fraud and abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Data Storage and Security</h2>
            <p className="text-slate-300 leading-relaxed">
              Your data is stored securely using industry-standard practices. We use Supabase for our database,
              which provides encryption at rest and in transit. Payment information is processed by Stripe and
              is never stored on our servers. We implement appropriate technical and organizational measures to
              protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Third-Party Services</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              We use the following third-party services:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li><strong>Stripe</strong> - Payment processing</li>
              <li><strong>Supabase</strong> - Database and authentication</li>
              <li><strong>Resend</strong> - Transactional emails</li>
              <li><strong>Vercel</strong> - Website hosting</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              Each of these services has their own privacy policies governing how they handle your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Cookies and Tracking</h2>
            <p className="text-slate-300 leading-relaxed">
              We use essential cookies to maintain your session and remember your preferences.
              We do not use advertising cookies or third-party tracking pixels. The Chrome extension
              stores your license key locally in your browser and does not use cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. Data Retention</h2>
            <p className="text-slate-300 leading-relaxed">
              We retain your account information for as long as your account is active. Transaction
              records are kept for accounting and legal purposes. You may request deletion of your
              account and associated data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Your Rights</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your account and data</li>
              <li>Opt out of marketing communications</li>
              <li>Export your data in a portable format</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Children&apos;s Privacy</h2>
            <p className="text-slate-300 leading-relaxed">
              Our services are not intended for children under 18 years of age. We do not knowingly
              collect personal information from children. If you believe we have collected information
              from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Changes to This Policy</h2>
            <p className="text-slate-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
              Your continued use of our services after any changes constitutes acceptance of the new policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Contact Us</h2>
            <p className="text-slate-300 leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="text-emerald-400 mt-2">
              <a href="mailto:support@hlextras.com" className="hover:underline">support@hlextras.com</a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
