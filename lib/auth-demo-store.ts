import { promises as fs } from "fs";
import path from "path";

export type DemoUser = {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  passwordHash: string;
  otpCode?: string | null;
  otpExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

const normalizeMobile = (value: string) => value.replace(/\s+/g, "").replace(/[^\d+]/g, "").trim();
const DEMO_STORE_PATH = path.join(process.cwd(), ".sportevent-demo-users.json");

export function isDatabaseUnavailable(error: unknown) {
  const message = String(error ?? "");
  return [
    "Can't reach database server",
    "database server",
    "P1001",
    "P1002",
    "ECONNREFUSED",
    "connection refused",
  ].some((fragment) => message.includes(fragment));
}

async function readDemoUsers(): Promise<Record<string, DemoUser>> {
  try {
    const fileContent = await fs.readFile(DEMO_STORE_PATH, "utf8");
    if (!fileContent.trim()) {
      return {};
    }
    return JSON.parse(fileContent) as Record<string, DemoUser>;
  } catch {
    return {};
  }
}

async function writeDemoUsers(users: Record<string, DemoUser>) {
  await fs.mkdir(path.dirname(DEMO_STORE_PATH), { recursive: true });
  await fs.writeFile(DEMO_STORE_PATH, JSON.stringify(users, null, 2));
}

export async function getDemoUserByMobile(mobileNumber: string): Promise<DemoUser | null> {
  const normalized = normalizeMobile(mobileNumber);
  const users = await readDemoUsers();
  return users[normalized] ?? null;
}

export async function createDemoUser(input: {
  name: string;
  mobileNumber: string;
  passwordHash: string;
  otpCode?: string | null;
  otpExpiresAt?: string | null;
}) {
  const normalized = normalizeMobile(input.mobileNumber);
  const users = await readDemoUsers();
  const user: DemoUser = {
    id: `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: input.name,
    email: `${normalized.replace(/\D/g, "")}@sportevent.local`,
    mobileNumber: normalized,
    passwordHash: input.passwordHash,
    otpCode: input.otpCode ?? null,
    otpExpiresAt: input.otpExpiresAt ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  users[normalized] = user;
  await writeDemoUsers(users);

  return user;
}

export async function updateDemoUserOtp(mobileNumber: string, otpCode: string, otpExpiresAt: Date) {
  const normalized = normalizeMobile(mobileNumber);
  const users = await readDemoUsers();
  const user = users[normalized];

  if (!user) {
    return null;
  }

  user.otpCode = otpCode;
  user.otpExpiresAt = otpExpiresAt.toISOString();
  user.updatedAt = new Date().toISOString();
  users[normalized] = user;
  await writeDemoUsers(users);

  return user;
}

export async function clearDemoUserOtp(mobileNumber: string) {
  const normalized = normalizeMobile(mobileNumber);
  const users = await readDemoUsers();
  const user = users[normalized];

  if (!user) {
    return null;
  }

  user.otpCode = null;
  user.otpExpiresAt = null;
  user.updatedAt = new Date().toISOString();
  users[normalized] = user;
  await writeDemoUsers(users);

  return user;
}
