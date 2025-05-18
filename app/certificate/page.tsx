'use client';

import dynamic from 'next/dynamic';

const CertificateDisplay = dynamic(
  () => import('./ClientCertificate'), // Ensure this path is correct
  { ssr: false }
);

export default function Page() {
  return <CertificateDisplay />;
}