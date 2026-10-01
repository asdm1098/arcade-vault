"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SessionUser } from "@/lib/types";

const USER_KEY = "av_user";

interface SessionContextValue {
  user: SessionUser | null;
  login: (user: SessionUser | null) => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);

  // Read after mount so server and first client render match (no session).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SessionUser | null;
      // One-time hydration from localStorage; must happen after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (parsed && typeof parsed.name === "string") setUser(parsed);
    } catch {}
  }, []);

  const login = useCallback((next: SessionUser | null) => {
    setUser(next);
    try {
      if (next) localStorage.setItem(USER_KEY, JSON.stringify(next));
      else localStorage.removeItem(USER_KEY);
    } catch {}
  }, []);

  const signOut = useCallback(() => login(null), [login]);

  const value = useMemo(
    () => ({ user, login, signOut }),
    [user, login, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
