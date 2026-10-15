"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Organization = { id: string; name: string };
type Tournament = { id: string; name: string; organizationId: string };

type Props =
  | {
      mode: "tournament";
      organizations: Organization[];
      tournaments?: never;
    }
  | {
      mode: "team";
      organizations?: never;
      tournaments: (Tournament & { organization: { name: string } })[];
    };

export default function ManagementClient(props: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedId, setSelectedId] = useState(
    props.mode === "tournament"
      ? props.organizations[0]?.id ?? ""
      : props.tournaments[0]?.id ?? "",
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const hasOptions =
    props.mode === "tournament" ? props.organizations.length > 0 : props.tournaments.length > 0;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const endpoint = props.mode === "tournament" ? "/api/tournaments" : "/api/teams";
      const body =
        props.mode === "tournament"
          ? { organizationId: selectedId, name, description }
          : { tournamentId: selectedId, name };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? `Unable to create ${props.mode}.`);
        return;
      }

      setName("");
      setDescription("");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">
        Create {props.mode === "tournament" ? "tournament" : "team"}
      </h2>
      {!hasOptions ? (
        <p className="mt-3 text-sm text-slate-600">
          {props.mode === "tournament"
            ? "Create an organization before adding a tournament."
            : "Create a tournament before adding a team."}
        </p>
      ) : (
        <form className="mt-5 space-y-4" onSubmit={submit}>
          {props.mode === "tournament" ? (
            <>
              <label className="block text-sm font-medium text-slate-700">
                Organization
                <select
                  value={selectedId}
                  onChange={(event) => setSelectedId(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
                >
                  {props.organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <label className="block text-sm font-medium text-slate-700">
              Tournament
              <select
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
              >
                {props.tournaments.map((tournament) => (
                  <option key={tournament.id} value={tournament.id}>
                    {tournament.name} · {tournament.organization.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-sm font-medium text-slate-700">
            {props.mode === "team" ? "Team name" : "Tournament name"}
            <input
              required
              minLength={2}
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          {props.mode === "tournament" ? (
            <label className="block text-sm font-medium text-slate-700">
              Description (optional)
              <textarea
                maxLength={500}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          ) : null}
          {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={busy || !selectedId}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Creating..." : "Create"}
          </button>
        </form>
      )}
    </section>
  );
}
