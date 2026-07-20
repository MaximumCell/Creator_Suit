import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AmbientBackground } from '@/components/landing/AmbientBackground';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingMarquee } from '@/components/landing/LandingMarquee';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingWorkflow } from '@/components/landing/LandingWorkflow';
import { LandingStats } from '@/components/landing/LandingStats';
import { LandingFaq } from '@/components/landing/LandingFaq';
import { LandingCta } from '@/components/landing/LandingCta';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const metadata = {
  title: 'CreatorSuit — The productivity OS for the Aaghaz AI team',
  description:
    'Internal productivity tool that unifies attendance, YouTube analytics, and a full content pipeline for the Aaghaz AI team.',
};

/**
 * Public landing page. If the user is already signed in, send them straight
 * to the dashboard — no point showing them the marketing.
 */
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect('/attendance');

  return (
    <>
      <AmbientBackground />
      <main className="relative min-h-screen overflow-x-hidden">
        <LandingNav />
        <LandingHero />
        <LandingMarquee />
        <LandingFeatures />
        <LandingWorkflow />
        <LandingStats />
        <LandingFaq />
        <LandingCta />
        <LandingFooter />
      </main>
    </>
  );
}
