import { Metadata } from 'next';
import { SubmitAppClient } from '@/components/SubmitAppClient';

export const metadata: Metadata = {
  title: 'Submit an Open-Source App - CrazyStore',
  description: 'Submit your open-source Android application to the CrazyStore index. Free, community-driven, zero telemetry.',
};

export default function SubmitPage() {
  return <SubmitAppClient />;
}
