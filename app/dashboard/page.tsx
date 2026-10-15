import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const organizations = await prisma.organization.findMany({
    where: {
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Dashboard</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">Your organizations</h1>
        </div>
        <Link
          href="/dashboard/organizations/new"
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          + New organization
        </Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {organizations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-600 md:col-span-2 xl:col-span-3">
            You have not created any organizations yet.
          </div>
        ) : (
          organizations.map((organization) => (
            <div key={organization.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Organization</p>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">{organization.name}</h2>
              <p className="mt-2 text-sm text-slate-500">/{organization.slug}</p>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
