// app/page.tsx

import React from "react";

import RecommendedSlider from "@/components/main/RecommendedSlider";
import ServicesGrid from "@/components/main/ServicesGrid";

export const dynamic = "force-dynamic";

import { getSessionUser } from "@/lib/session";

export default async function RootPage() {
  const user = await getSessionUser();

  return (
    <>
      <RecommendedSlider isLoggedIn={!!user} />
      <ServicesGrid isLoggedIn={!!user} />
    </>
  );
}
