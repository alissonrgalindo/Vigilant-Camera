import { useEffect } from "react";
import { supabase } from "../../utils/supabase/client";

export default function SupabaseListener() {
  useEffect(() => {
    Notification.requestPermission();

    const channel = supabase
      .channel("motion_events_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "motion_events",
        },
        (payload) => {
          const { snapshot } = payload.new;
          new Notification("🚨 Movimento Detectado!", {
            body: "Clique para visualizar o snapshot.",
            image: snapshot,
          }as any);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
