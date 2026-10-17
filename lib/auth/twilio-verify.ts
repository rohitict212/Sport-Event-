import { Buffer } from "node:buffer";

type TwilioConfig = {
  accountSid: string;
  authToken: string;
  verifyServiceSid: string;
};

function getTwilioConfig(): TwilioConfig {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = process.env;

  if (
    !TWILIO_ACCOUNT_SID ||
    !/^AC[0-9a-fA-F]{32}$/.test(TWILIO_ACCOUNT_SID) ||
    !TWILIO_AUTH_TOKEN ||
    !TWILIO_VERIFY_SERVICE_SID ||
    !/^VA[0-9a-fA-F]{32}$/.test(TWILIO_VERIFY_SERVICE_SID)
  ) {
    throw new Error("Twilio Verify is not configured.");
  }

  return {
    accountSid: TWILIO_ACCOUNT_SID,
    authToken: TWILIO_AUTH_TOKEN,
    verifyServiceSid: TWILIO_VERIFY_SERVICE_SID,
  };
}

async function twilioRequest(path: string, body: URLSearchParams) {
  const config = getTwilioConfig();
  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${encodeURIComponent(config.verifyServiceSid)}${path}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return { ok: false as const, status: response.status };
  }

  return { ok: true as const, data: (await response.json()) as { status?: string } };
}

export async function sendPhoneVerification(phoneNumber: string) {
  const body = new URLSearchParams({ To: phoneNumber, Channel: "sms" });
  return twilioRequest("/Verifications", body);
}

export async function checkPhoneVerification(phoneNumber: string, code: string) {
  const body = new URLSearchParams({ To: phoneNumber, Code: code });
  return twilioRequest("/VerificationCheck", body);
}
