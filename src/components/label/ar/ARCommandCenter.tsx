/**
 * A&R Command Center — Main dashboard for the A&R role.
 */
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useARProspects, useARBrief } from "@/hooks/useARData";
import ARSignalReportCard from "./ARSignalReportCard";
import ARPipelineTable from "./ARPipelineTable";
import ARPipelineTabs from "./ARPipelineTabs";

const PAGE_SIZE_OPTIONS = [20, 50, 100, 200] as const;

export default function ARCommandCenter() {
  const [pageSize, setPageSize] = useState<number>(50);
  const [page, setPage] = useState(0);

  const { data, isLoading, error, isFetching } = useARProspects({
    limit: pageSize,
    offset: page * pageSize,
  });
  const briefQuery = useARBrief();

  const prospects = data?.prospects ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(0);
  }, []);

  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-6">
      {/* ── Header ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between gap-4 flex-wrap"
      >
        <div className="flex items-center gap-3">
          <h1
            className="text-[18px] md:text-[20px] font-semibold"
            style={{
              fontFamily: '"DM Sans", sans-serif',
              color: "rgba(255,255,255,0.87)",
            }}
          >
            A&R Pipeline
          </h1>
          <span
            className="text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded"
            style={{ color: "#e8430a", background: "rgba(232,67,10,0.10)" }}
          >
            {isLoading ? "…" : total} Prospects
          </span>
        </div>
      </motion.div>

      {/* ── Loading / Error ───────────────────────────────── */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2
            size={24}
            className="animate-spin"
            style={{ color: "rgba(255,255,255,0.30)" }}
          />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-4 text-[13px] text-red-400">
          Failed to load prospects. Check your connection and try again.
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* ── Signal Report Card ────────────────────────── */}
          <ARSignalReportCard
            prospects={prospects}
            brief={briefQuery.data ?? null}
          />

          {/* ── Pipeline Table ────────────────────────────── */}
          <div className="overflow-x-auto">
            <ARPipelineTable
              prospects={prospects}
              total={total}
              page={page}
              pageSize={pageSize}
              totalPages={totalPages}
              isFetching={isFetching}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>

          {/* ── Bottom Tabs ───────────────────────────────── */}
          <div className="overflow-x-auto">
            <ARPipelineTabs prospects={prospects} />
          </div>
        </>
      )}
    </div>
  );
}
