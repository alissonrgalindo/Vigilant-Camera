import { useEffect } from "react";
import { supabase } from "../../utils/supabase/client";

export default function SupabaseListener() {
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

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
          const { snapshot, device } = payload.new;
          console.log("📡 Novo movimento detectado:", payload.new);

          new Notification("🚨 Movimento Detectado!", {
            body: `Dispositivo: ${device}`,
            image: snapshot,
          } as any);

          if ("vibrate" in navigator) {
            navigator.vibrate?.(200);
          }

          const audio = new Audio("/alert.mp3");
          audio.play().catch(() => {
            console.warn("🔇 Falha ao tocar som de alerta (talvez bloqueado por autoplay)");
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
