import { useEffect, useState } from "react";
import { me, MeResponse } from "@/lib/auth";

export function usePermissions() {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const canEdit = user?.role === "ADMIN" || user?.role === "MANAGER";
  const isAdmin = user?.role === "ADMIN";
  const isStaff = user?.role === "STAFF";

  return {
    user,
    loading,
    canEdit,
    isAdmin,
    isStaff,
  };
}
