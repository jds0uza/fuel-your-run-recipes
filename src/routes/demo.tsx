import { createFileRoute, redirect } from "@tanstack/react-router";

// The demo now lives on the home page; keep old links working.
export const Route = createFileRoute("/demo")({
  beforeLoad: () => {
    throw redirect({ to: "/", statusCode: 301 });
  },
});
