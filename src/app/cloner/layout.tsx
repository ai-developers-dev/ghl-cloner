import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HL Cloner - Clone Any GHL Page Instantly',
  description: 'Clone any GoHighLevel funnel page in seconds. Copy designs, layouts, and elements with one click. No subscriptions - pay only for what you use.',
  keywords: ['GHL page cloner', 'GoHighLevel cloner', 'clone GHL page', 'copy GHL funnel', 'GHL page copy tool', 'funnel cloner'],
  alternates: {
    canonical: '/cloner',
  },
  openGraph: {
    title: 'HL Cloner - Clone Any GHL Page Instantly',
    description: 'Clone any GoHighLevel funnel page in seconds. Copy designs, layouts, and elements with one click. No subscriptions - pay only for what you use.',
    url: 'https://hlextras.com/cloner',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'HL Cloner - Clone GHL Pages',
      },
    ],
  },
};

export default function ClonerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
