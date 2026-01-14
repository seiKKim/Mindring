// app/page.tsx

import React from 'react';

import RecommendedSlider from '@/components/main/RecommendedSlider';
import ServicesGrid from '@/components/main/ServicesGrid';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  return (
    <>
      <RecommendedSlider />
      <ServicesGrid />
    </>
  );
}
