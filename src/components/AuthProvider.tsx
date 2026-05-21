import { useEffect, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth, isFirebaseConfigured } from "@/services/firebase";
import { useAuth } from "@/store/auth";
import { useTheme } from "@/store/theme";

export function AuthProvider({ children }: { children: ReactNode }) {
  const setUser = useAuth((s) => s.setUser);
  const setLoading = useAuth((s) => s.setLoading);
  const initTheme = useTheme((s) => s.init);

  useEffect(() => {
    initTheme();
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(firebaseAuth(), (u) => setUser(u));
    return () => unsub();
  }, [setUser, setLoading, initTheme]);

  return <>{children}</>;
}
