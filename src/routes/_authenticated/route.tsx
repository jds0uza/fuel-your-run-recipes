import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // Temporarily redirect until accounts are shipped
    throw redirect({ to: "/" });
  },
  component: () => <Outlet />,
});
