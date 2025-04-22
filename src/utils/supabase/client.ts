import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function notifyMotion(snapshotBase64: string) {
  await supabase.from("motion_events").insert({
    device: "computador",
    snapshot: snapshotBase64,
  });
}
