import { Suspense, useState, useEffect } from "react";
import { Outlet, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { HealthData } from "@/components/admin/health/types";
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} from "@/components/admin/health/constants";
import { useIsMobile } from "@/hooks/use-mobile";
import HealthSidebar from "./HealthSidebar";

async function fetchHealthData(): Promise<HealthData> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error("Not authenticated");
  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-health`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export interface HealthOutletContext {
  data: HealthData | undefined;
  isLoading: boolean;
  error: Error | null;
  dataUpdatedAt: number;
  refetch: () => void;
  secondsAgo: number;
}

export function useHealthData() {
  return useOutletContext<HealthOutletContext>();
}

export default function HealthLayout() {
  const isMobile = useIsMobile();
  const [secondsAgo, setSecondsAgo] = useState(0);

  const { data, isLoading, error, dataUpdatedAt, refetch } =
    useQuery<HealthData>({
      queryKey: ["admin-health"],
      queryFn: fetchHealthData,
      refetchInterval: 60_000,
      staleTime: 30_000,
    });

  useEffect(() => {
    if (!dataUpdatedAt) return;
    setSecondsAgo(0);
    const tick = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - dataUpdatedAt) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [dataUpdatedAt]);

  const ctx: HealthOutletContext = {
    data,
    isLoading,
    error: error as Error | null,
    dataUpdatedAt,
    refetch,
    secondsAgo,
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        overflow: "hidden",
        flexDirection: isMobile ? "column" : "row",
      }}
    >
      <HealthSidebar
        overallHealth={data?.overall_health}
        secondsAgo={secondsAgo}
        onRefresh={refetch}
        isMobile={isMobile}
      />
      <main
        style={{
          flex: 1,
          overflow: "auto",
          padding: isMobile ? "16px" : "24px 32px",
        }}
      >
        {isLoading && !data ? (
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              color: "var(--ink-tertiary)",
              fontSize: 14,
              padding: 24,
            }}
          >
            Loading system health...
          </div>
        ) : error && !data ? (
          <div
            style={{
              fontFamily: '"DM Sans", sans-serif',
              color: "#ef4444",
              fontSize: 14,
              padding: 24,
            }}
          >
            Failed to load: {(error as Error).message}
          </div>
        ) : (
          <Suspense
            fallback={
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  color: "var(--ink-tertiary)",
                  fontSize: 14,
                  padding: 24,
                }}
              >
                Loading...
              </div>
            }
          >
            <Outlet context={ctx} />
          </Suspense>
        )}
      </main>
    </div>
  );
}
