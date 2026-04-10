import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

interface PageTitleState {
  title: string | null;
  setTitle: (t: string | null) => void;
}

const PageTitleContext = createContext<PageTitleState>({
  title: null,
  setTitle: () => {},
});

export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitleRaw] = useState<string | null>(null);
  const setTitle = useCallback((t: string | null) => setTitleRaw(t), []);
  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
}

/** Call in page components to set a dynamic breadcrumb title.
 *  Clears automatically on unmount. */
export function useSetPageTitle(title: string | null) {
  const { setTitle } = useContext(PageTitleContext);
  useEffect(() => {
    setTitle(title);
    return () => setTitle(null);
  }, [title, setTitle]);
}

/** Read the current page title (used by layout breadcrumbs) */
export function usePageTitle() {
  return useContext(PageTitleContext).title;
}
