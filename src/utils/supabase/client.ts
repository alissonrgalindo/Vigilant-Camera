import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

async function notifyMotion(snapshotBase64: string) {
  await supabase.from("motion_events").insert({
    device: "computador",
    snapshot: snapshotBase64,
  });
}
