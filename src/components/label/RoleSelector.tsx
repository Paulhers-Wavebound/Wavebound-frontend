import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  useDashboardRole,
  type DashboardRole,
} from "@/contexts/DashboardRoleContext";

const ROLES: { value: DashboardRole; label: string }[] = [
  { value: "marketing", label: "Digital Marketing" },
  { value: "content", label: "Content & Social" },
  { value: "ar", label: "A&R" },
];

export default function RoleSelector() {
  const { role, setRole } = useDashboardRole();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.06] text-sm font-medium text-white/87 hover:border-white/12 transition-colors"
        style={{ background: "#2C2C2E" }}
      >
        {ROLES.find((r) => r.value === role)?.label}
        <ChevronDown size={14} className="text-white/40" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-white/[0.06] py-1 shadow-xl"
            style={{ background: "#2C2C2E" }}
          >
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => {
                  setRole(r.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  role === r.value
                    ? "text-[#e8430a] bg-white/[0.03]"
                    : "text-white/70 hover:bg-white/[0.03]"
                }`}
              >
                {r.label}
                {role === r.value && (
                  <span className="float-right text-[#e8430a]">&#10003;</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
