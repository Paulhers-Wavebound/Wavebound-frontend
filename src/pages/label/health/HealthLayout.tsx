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
import ErrorBoundary from "@/components/ErrorBoundary";
import HealthSidebar from "./HealthSidebar";
import HealthLoadingSkeleton from "./HealthLoadingSkeleton";

function HealthErrorFallback({
  error,
  resetError,
}: {
  error?: Error;
  resetError: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!error?.message) return;
    navigator.clipboard.writeText(error.message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      style={{
        padding: 32,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        maxWidth: 420,
        margin: "48px auto",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "rgba(239, 68, 68, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
        }}
      >
        !
      </div>
      <h3
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 16,
          fontWeight: 600,
          color: "var(--ink)",
          margin: 0,
        }}
      >
        This section crashed
      </h3>
      {error?.message && (
        <div style={{ width: "100%", position: "relative" }}>
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 11,
              color: "#ef4444",
              background: "rgba(239, 68, 68, 0.06)",
              borderRadius: 8,
              padding: "10px 14px",
              width: "100%",
              wordBreak: "break-word",
              maxHeight: 120,
              overflow: "auto",
            }}
          >
            {error.message}
          </div>
          <button
            onClick={handleCopy}
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 10,
              fontWeight: 500,
              padding: "3px 8px",
              borderRadius: 4,
              border: "1px solid rgba(239, 68, 68, 0.2)",
              background: "rgba(239, 68, 68, 0.08)",
              color: "#ef4444",
              cursor: "pointer",
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
      <button
        onClick={resetError}
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 13,
          fontWeight: 600,
          padding: "8px 20px",
          borderRadius: 8,
          border: "none",
          background: "#e8430a",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Try Again
      </button>
      <p
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 12,
          color: "var(--ink-faint)",
          margin: 0,
          textAlign: "center",
        }}
      >
        Use the sidebar to navigate to a different section.
      </p>
    </div>
  );
}

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
      staleTime: 60_000,
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
          <HealthLoadingSkeleton />
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
          <Suspense fallback={<HealthLoadingSkeleton />}>
            <ErrorBoundary fallback={HealthErrorFallback}>
              <Outlet context={ctx} />
            </ErrorBoundary>
          </Suspense>
        )}
      </main>
    </div>
  );
}
