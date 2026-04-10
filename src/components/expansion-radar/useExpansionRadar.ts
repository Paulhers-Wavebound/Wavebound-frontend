import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ExpansionRadarResponse } from "./types";

const SUPABASE_URL = "https://kxvgbowrkmowuyezoeke.supabase.co";

export function useExpansionRadar(entityId: string | null) {
  const [data, setData] = useState<ExpansionRadarResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!entityId) {
      setData(null);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");

        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/expansion-intelligence`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ entity_id: entityId }),
          },
        );

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
        const result = await response.json();
        if (!cancelled) setData(result);
      } catch (err: unknown) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [entityId]);

  return { data, loading, error };
}
