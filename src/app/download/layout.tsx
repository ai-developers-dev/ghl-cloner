import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Download HLExtras Chrome Extension',
  description: 'Download and install the HLExtras Chrome extension. Step-by-step installation guide for the GHL page cloning tool.',
  keywords: ['HLExtras download', 'GHL cloner extension', 'Chrome extension download', 'GoHighLevel extension'],
  alternates: {
    canonical: '/download',
  },
  openGraph: {
    title: 'Download HLExtras Chrome Extension',
    description: 'Download and install the HLExtras Chrome extension. Step-by-step installation guide for the GHL page cloning tool.',
    url: 'https://hlextras.com/download',
  },
};

export default function DownloadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
