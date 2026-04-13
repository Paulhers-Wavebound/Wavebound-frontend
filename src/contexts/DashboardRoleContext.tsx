import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type DashboardRole = "marketing" | "content" | "ar";

interface DashboardRoleContextValue {
  role: DashboardRole;
  setRole: (r: DashboardRole) => void;
  roleLabel: string;
}

const DashboardRoleContext = createContext<DashboardRoleContextValue | null>(
  null,
);

export function DashboardRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<DashboardRole>(
    () =>
      (localStorage.getItem("label-dashboard-role") as DashboardRole) ||
      "marketing",
  );

  const setRole = useCallback((r: DashboardRole) => {
    setRoleState(r);
    localStorage.setItem("label-dashboard-role", r);
  }, []);

  const roleLabel =
    role === "marketing"
      ? "Digital Marketing"
      : role === "ar"
        ? "A&R"
        : "Content & Social";

  return (
    <DashboardRoleContext.Provider value={{ role, setRole, roleLabel }}>
      {children}
    </DashboardRoleContext.Provider>
  );
}

export function useDashboardRole(): DashboardRoleContextValue {
  const ctx = useContext(DashboardRoleContext);
  if (!ctx) {
    throw new Error(
      "useDashboardRole must be used within a DashboardRoleProvider",
    );
  }
  return ctx;
}
