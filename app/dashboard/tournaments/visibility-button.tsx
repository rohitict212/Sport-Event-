"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TournamentVisibilityButton({
  tournamentId,
  isPublic,
}: {
  tournamentId: string;
  isPublic: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggleVisibility() {
    setBusy(true);
    setError("");

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !isPublic }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Unable to update tournament visibility.");
        return;
      }

      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs font-medium text-slate-500">{isPublic ? "Public" : "Private"}</span>
      <button
        type="button"
        onClick={toggleVisibility}
        disabled={busy}
        className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 disabled:opacity-60"
      >
        {busy ? "Updating..." : isPublic ? "Make private" : "Publish"}
      </button>
      {error ? <span role="alert" className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
