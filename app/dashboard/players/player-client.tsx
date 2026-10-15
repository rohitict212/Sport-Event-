"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Team = {
  id: string;
  name: string;
  organizationId: string;
  organization: { name: string };
  tournament: { name: string };
};

export default function PlayerManagementClient({ teams }: { teams: Team[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(teams[0]?.id ?? "");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const response = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: selectedId, name, role, jerseyNumber }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Unable to create player.");
        return;
      }

      setName("");
      setRole("");
      setJerseyNumber("");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (teams.length === 0) {
    return (
      <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Add player</h2>
        <p className="mt-3 text-sm text-slate-600">Create a team first before adding players.</p>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">Add player</h2>
      <form className="mt-5 space-y-4" onSubmit={submit}>
        <label className="block text-sm font-medium text-slate-700">
          Team
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name} · {team.tournament.name} · {team.organization.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Player name
          <input
            required
            minLength={2}
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Role (optional)
          <input
            maxLength={50}
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Jersey number (optional)
          <input
            maxLength={20}
            value={jerseyNumber}
            onChange={(event) => setJerseyNumber(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={busy || !selectedId}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Saving..." : "Add player"}
        </button>
      </form>
    </aside>
  );
}
