"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        setError("Unable to sign out. Please try again.");
        return;
      }
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={logout}
        disabled={busy}
        className="text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-60"
      >
        {busy ? "Signing out..." : "Sign out"}
      </button>
      {error ? <span role="alert" className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
