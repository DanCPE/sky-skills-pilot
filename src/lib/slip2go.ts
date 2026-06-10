export interface Slip2GoVerificationInput {
  miniQrPayload?: string | null;
  slipFileName: string;
  slipContentType: string;
  slipBytes: Buffer;
}

export interface Slip2GoVerificationResult {
  ok: boolean;
  verified: boolean;
  status: string;
  transRef: string | null;
  amountThb: number | null;
  raw: unknown;
  error: string | null;
  durationMs: number;
}

type JsonObject = Record<string, unknown>;

const successStatuses = new Set([
  "success",
  "valid",
  "verified",
  "approved",
  "ok",
  "true",
  "200",
]);

const transRefKeys = new Set([
  "transref",
  "trans_ref",
  "transactionref",
  "transactionreference",
  "transaction_reference",
  "transactionid",
  "transaction_id",
  "banktransref",
  "banktransactionref",
  "ref",
  "reference",
]);

const amountKeys = new Set([
  "amount",
  "totalamount",
  "total_amount",
  "transferamount",
  "transfer_amount",
  "transactionamount",
  "transaction_amount",
  "paidamount",
  "paid_amount",
]);

function getEnv(name: string, fallback = "") {
  return process.env[name]?.trim() || fallback;
}

export function isSlip2GoConfigured() {
  return Boolean(getEnv("SLIP2GO_API_URL"));
}

function authHeaders() {
  const apiKey = getEnv("SLIP2GO_API_KEY");
  if (!apiKey) return {};

  const headerName = getEnv("SLIP2GO_AUTH_HEADER", "Authorization");
  const scheme = getEnv("SLIP2GO_AUTH_SCHEME", "Bearer");
  return {
    [headerName]: scheme ? `${scheme} ${apiKey}` : apiKey,
  };
}

function normalizeKey(key: string) {
  return key.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
}

function walkObject(
  value: unknown,
  matcher: (key: string, value: unknown) => unknown,
): unknown {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = walkObject(item, matcher);
      if (found !== null && found !== undefined && found !== "") return found;
    }
    return null;
  }

  for (const [key, item] of Object.entries(value as JsonObject)) {
    const matched = matcher(normalizeKey(key), item);
    if (matched !== null && matched !== undefined && matched !== "") {
      return matched;
    }
  }

  for (const item of Object.values(value as JsonObject)) {
    const found = walkObject(item, matcher);
    if (found !== null && found !== undefined && found !== "") return found;
  }

  return null;
}

function asText(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function asAmountThb(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;

  const normalized = value.replace(/,/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function inferVerified(httpOk: boolean, raw: unknown) {
  if (!httpOk) return false;
  if (!raw || typeof raw !== "object") return httpOk;

  const explicit = walkObject(raw, (key, value) => {
    if (["verified", "valid", "success", "ok"].includes(key)) return value;
    if (["status", "code", "statuscode"].includes(key)) return value;
    return null;
  });

  if (typeof explicit === "boolean") return explicit;
  const text = asText(explicit).toLowerCase();
  return text ? successStatuses.has(text) : httpOk;
}

function inferStatus(raw: unknown, responseOk: boolean) {
  const status = walkObject(raw, (key, value) => {
    if (["status", "message", "code", "statuscode"].includes(key)) {
      return value;
    }
    return null;
  });
  return asText(status) || (responseOk ? "verified" : "failed");
}

function inferTransRef(raw: unknown) {
  const found = walkObject(raw, (key, value) =>
    transRefKeys.has(key) ? value : null,
  );
  return asText(found) || null;
}

function inferAmountThb(raw: unknown) {
  const found = walkObject(raw, (key, value) =>
    amountKeys.has(key) ? value : null,
  );
  return asAmountThb(found);
}

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

export async function verifySlipWithSlip2Go(
  input: Slip2GoVerificationInput,
): Promise<Slip2GoVerificationResult> {
  const apiUrl = getEnv("SLIP2GO_API_URL");
  if (!apiUrl) {
    throw new Error("SLIP2GO_API_URL is not configured.");
  }

  const startedAt = Date.now();
  const mode = getEnv("SLIP2GO_REQUEST_MODE", "multipart").toLowerCase();
  const qrField = getEnv("SLIP2GO_QR_FIELD", "qrCode");
  const imageField = getEnv("SLIP2GO_IMAGE_FIELD", "image");
  const base64Field = getEnv("SLIP2GO_BASE64_FIELD", "image");
  const miniQrPayload = input.miniQrPayload?.trim() || "";

  const headers: HeadersInit = authHeaders();
  let body: BodyInit;

  if (mode === "json") {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(
      miniQrPayload
        ? { [qrField]: miniQrPayload }
        : {
            [base64Field]: input.slipBytes.toString("base64"),
            fileName: input.slipFileName,
            mimeType: input.slipContentType,
          },
    );
  } else {
    const formData = new FormData();
    if (miniQrPayload) formData.set(qrField, miniQrPayload);
    const fileBuffer = new ArrayBuffer(input.slipBytes.byteLength);
    new Uint8Array(fileBuffer).set(input.slipBytes);
    formData.set(
      imageField,
      new Blob([fileBuffer], { type: input.slipContentType }),
      input.slipFileName,
    );
    body = formData;
  }

  const response = await fetch(apiUrl, {
    method: getEnv("SLIP2GO_METHOD", "POST"),
    headers,
    body,
    cache: "no-store",
  });
  const raw = await parseResponse(response);
  const verified = inferVerified(response.ok, raw);

  return {
    ok: response.ok,
    verified,
    status: inferStatus(raw, response.ok),
    transRef: inferTransRef(raw),
    amountThb: inferAmountThb(raw),
    raw,
    error: response.ok ? null : `Slip2Go returned HTTP ${response.status}.`,
    durationMs: Date.now() - startedAt,
  };
}
