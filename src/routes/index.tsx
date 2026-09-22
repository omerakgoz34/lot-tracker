import { createFileRoute } from "@tanstack/react-router";
import { LotKeepApp } from "@/components/lotkeep-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <LotKeepApp />;
}
