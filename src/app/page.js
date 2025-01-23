import React, { Suspense } from "react";
import HomePageContent from "./HomePageContent";

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading Home Page...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
