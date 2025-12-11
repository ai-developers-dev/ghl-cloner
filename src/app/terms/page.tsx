import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Terms of Service | HLExtras',
  description: 'Terms of Service for HLExtras - Read our terms and conditions for using our services.',
};

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-slate-400 mb-8">Last updated: December 11, 2024</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-300 leading-relaxed">
              By accessing or using HLExtras services, including the HL Cloner Chrome extension and website
              at hlextras.com, you agree to be bound by these Terms of Service. If you do not agree to
              these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p className="text-slate-300 leading-relaxed">
              HLExtras provides the HL Cloner Chrome extension, which allows users to copy the design and
              structure of GoHighLevel funnel pages. The service operates on a credit-based system where
              each page clone consumes one credit. Credits can be purchased through our website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. User Accounts</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              To use our services, you must:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials and license key</li>
              <li>Be at least 18 years of age or have parental consent</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              You are responsible for all activities that occur under your account. We reserve the right
              to suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Acceptable Use</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              You agree to use our services only for lawful purposes. You must NOT:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>Clone pages without proper authorization from the content owner</li>
              <li>Use cloned content to infringe on intellectual property rights</li>
              <li>Share, resell, or distribute your license key to others</li>
              <li>Attempt to reverse engineer, decompile, or hack our software</li>
              <li>Use automated tools or bots to abuse our services</li>
              <li>Circumvent credit usage tracking or licensing mechanisms</li>
              <li>Use our services for any illegal or fraudulent purpose</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Intellectual Property Disclaimer</h2>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
              <p className="text-amber-200 leading-relaxed font-medium">
                IMPORTANT: Cloning funnels or websites without permission may infringe on intellectual
                property rights and copyrights. You are solely responsible for ensuring you have the
                right to clone and use any content.
              </p>
            </div>
            <p className="text-slate-300 leading-relaxed">
              HLExtras is a tool that facilitates copying page designs. We do not own, endorse, or take
              responsibility for any content you clone. You should use cloned designs for inspiration
              and learning purposes, and always create original content for your own funnels. Never
              copy someone&apos;s work without their explicit permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Payments and Refunds</h2>

            <h3 className="text-lg font-medium text-white mt-4 mb-2">Pricing</h3>
            <p className="text-slate-300 leading-relaxed">
              Credits are sold in packages at prices displayed on our website. All prices are in USD.
              We reserve the right to change prices at any time, but changes will not affect credits
              already purchased.
            </p>

            <h3 className="text-lg font-medium text-white mt-4 mb-2">No Subscriptions</h3>
            <p className="text-slate-300 leading-relaxed">
              We operate on a one-time purchase model. There are no recurring subscriptions.
              Credits do not expire and remain in your account until used.
            </p>

            <h3 className="text-lg font-medium text-white mt-4 mb-2">Refund Policy</h3>
            <p className="text-slate-300 leading-relaxed">
              Due to the digital nature of our product, all sales are final. However, if you experience
              technical issues that prevent you from using the service, please contact us within 7 days
              of purchase and we will work with you to resolve the issue or provide a refund at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">7. License Key Terms</h2>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>Each license key is for personal use by one individual</li>
              <li>License keys may not be shared, sold, or transferred</li>
              <li>We reserve the right to revoke license keys that violate these terms</li>
              <li>Lost license keys can be recovered by contacting support with your purchase email</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">8. Affiliate Program</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Our affiliate program allows you to earn commissions on referred sales. By participating:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>You must not use misleading or deceptive marketing practices</li>
              <li>You may not bid on our brand terms in paid advertising</li>
              <li>Commissions are paid monthly for approved referrals</li>
              <li>We reserve the right to modify commission rates or terminate affiliates</li>
              <li>Self-referrals are not eligible for commission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">9. Service Availability</h2>
            <p className="text-slate-300 leading-relaxed">
              We strive to maintain high availability but do not guarantee uninterrupted service.
              We may temporarily suspend service for maintenance, updates, or circumstances beyond
              our control. We are not liable for any losses resulting from service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">10. Limitation of Liability</h2>
            <p className="text-slate-300 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, HLEXTRAS SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO
              LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES, REGARDLESS OF THE CAUSE OF ACTION.
              OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE SERVICE IN THE PAST
              12 MONTHS.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">11. Disclaimer of Warranties</h2>
            <p className="text-slate-300 leading-relaxed">
              OUR SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
              EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE ERROR-FREE,
              UNINTERRUPTED, OR MEET YOUR SPECIFIC REQUIREMENTS. WE ARE NOT AFFILIATED WITH OR
              ENDORSED BY GOHIGHLEVEL.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">12. Indemnification</h2>
            <p className="text-slate-300 leading-relaxed">
              You agree to indemnify and hold harmless HLExtras, its officers, directors, employees,
              and agents from any claims, damages, losses, or expenses arising from your use of the
              service, violation of these terms, or infringement of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">13. Termination</h2>
            <p className="text-slate-300 leading-relaxed">
              We may terminate or suspend your access to our services at any time, with or without
              cause or notice. Upon termination, your right to use the service ceases immediately.
              Unused credits are non-refundable upon termination for cause.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">14. Governing Law</h2>
            <p className="text-slate-300 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the
              United States. Any disputes arising from these terms or your use of our services
              shall be resolved through binding arbitration.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">15. Changes to Terms</h2>
            <p className="text-slate-300 leading-relaxed">
              We reserve the right to modify these Terms of Service at any time. We will notify
              users of material changes by posting a notice on our website. Your continued use
              of the service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">16. Contact Information</h2>
            <p className="text-slate-300 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at:
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
