export interface Slip2GoVerificationInput {
  miniQrPayload?: string | null;
  receiverAccountNumbers?: string[];
  receiverAccountType?: string | null;
  slipFileName: string;
  slipContentType: string;
  slipBytes: Buffer;
}

export interface Slip2GoVerificationResult {
  ok: boolean;
  verified: boolean;
  status: string;
  message: string | null;
  httpStatus: number;
  endpoint: string;
  requestMode: string;
  transRef: string | null;
  amountThb: number | null;
  raw: unknown;
  error: string | null;
  durationMs: number;
}

type JsonObject = Record<string, unknown>;

export interface Slip2GoExpectedReceiver {
  accountNumber?: string | null;
  accountName?: string | null;
  promptPayId?: string | null;
}

const successStatuses = new Set([
  "success",
  "valid",
  "verified",
  "approved",
  "ok",
  "true",
  "200",
  "200000",
  "200200",
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
  return Boolean(getEnv("SLIP2GO_API_URL") || getEnv("SLIP2GO_API_BASE_URL"));
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

function getPath(value: unknown, path: string[]) {
  let current = value;
  for (const segment of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return null;
    }
    current = (current as JsonObject)[segment];
  }
  return current;
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
    if (["status", "code", "statuscode"].includes(key)) {
      return value;
    }
    return null;
  });
  return asText(status) || (responseOk ? "verified" : "failed");
}

function inferMessage(raw: unknown) {
  const message = walkObject(raw, (key, value) => {
    if (["message", "msg", "description", "error", "errormessage"].includes(key)) {
      return value;
    }
    return null;
  });
  return asText(message) || null;
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

function normalizeIdentifier(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function normalizeName(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

function cleanReceiverValue(value: string) {
  const trimmed = value.trim();
  return trimmed.toLowerCase() === "null" ? "" : trimmed;
}

function maskedIdentifierMatches(actual: string, expected: string) {
  const normalizedActual = normalizeIdentifier(actual);
  const normalizedExpected = normalizeIdentifier(expected);
  if (!normalizedActual || !normalizedExpected) return false;
  if (normalizedActual === normalizedExpected) return true;

  const visibleSuffix = normalizedActual.match(/[A-Z0-9]+$/)?.[0] ?? "";
  if (visibleSuffix.length >= 4) {
    return normalizedExpected.endsWith(visibleSuffix);
  }

  return false;
}

export function validateSlip2GoReceiver(
  raw: unknown,
  expected: Slip2GoExpectedReceiver,
) {
  const expectedAccountNumber = expected.accountNumber?.trim() ?? "";
  const expectedPromptPayId = expected.promptPayId?.trim() ?? "";
  const expectedAccountName = expected.accountName?.trim() ?? "";

  const receiverBankAccount = cleanReceiverValue(
    asText(getPath(raw, ["data", "receiver", "account", "bank", "account"])),
  );
  const receiverProxyAccount = cleanReceiverValue(
    asText(getPath(raw, ["data", "receiver", "account", "proxy", "account"])),
  );
  const receiverProxyType = cleanReceiverValue(
    asText(getPath(raw, ["data", "receiver", "account", "proxy", "type"])),
  );
  const receiverName = cleanReceiverValue(
    asText(getPath(raw, ["data", "receiver", "account", "name"])),
  );

  if (expectedAccountNumber && receiverBankAccount) {
    if (!maskedIdentifierMatches(receiverBankAccount, expectedAccountNumber)) {
      return {
        ok: false,
        reason: "Destination bank account does not match the configured receiving account.",
      };
    }
    return { ok: true, reason: null };
  }

  if (expectedPromptPayId && receiverProxyAccount) {
    if (!maskedIdentifierMatches(receiverProxyAccount, expectedPromptPayId)) {
      return {
        ok: false,
        reason: `Destination ${receiverProxyType || "proxy"} account does not match the configured receiving PromptPay/Biller ID.`,
      };
    }
    return { ok: true, reason: null };
  }

  if (expectedAccountName && receiverName) {
    if (normalizeName(receiverName) !== normalizeName(expectedAccountName)) {
      return {
        ok: false,
        reason: "Destination account name does not match the configured receiving account name.",
      };
    }
    return { ok: true, reason: null };
  }

  return {
    ok: false,
    reason:
      "Slip2Go did not return enough receiver data to confirm the destination account.",
  };
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

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function resolveEndpoint(mode: string) {
  const configuredUrl = getEnv("SLIP2GO_API_URL");
  const baseUrl = getEnv("SLIP2GO_API_BASE_URL", configuredUrl);

  if (configuredUrl.includes("/api/verify-slip/")) {
    const baseFromFullUrl = configuredUrl.split("/api/verify-slip/")[0];
    if (mode === "qr-code") {
      return joinUrl(baseFromFullUrl, "/api/verify-slip/qr-code/info");
    }
    if (mode === "base64") {
      return joinUrl(baseFromFullUrl, "/api/verify-slip/qr-base64/info");
    }
    return joinUrl(baseFromFullUrl, "/api/verify-slip/qr-image/info");
  }

  if (mode === "qr-code") {
    return joinUrl(baseUrl, "/api/verify-slip/qr-code/info");
  }
  if (mode === "base64") {
    return joinUrl(baseUrl, "/api/verify-slip/qr-base64/info");
  }
  return joinUrl(baseUrl, "/api/verify-slip/qr-image/info");
}

function resolveRequestMode(configuredMode: string, hasMiniQrPayload: boolean) {
  if (configuredMode === "auto") {
    return hasMiniQrPayload ? "qr-code" : "qr-image";
  }
  if (configuredMode === "json") return hasMiniQrPayload ? "qr-code" : "base64";
  if (configuredMode === "multipart") return "qr-image";
  return configuredMode;
}

function dataUrlBase64(contentType: string, bytes: Buffer) {
  return `data:${contentType};base64,${bytes.toString("base64")}`;
}

function buildReceiverCheck(accountNumbers?: string[], accountType?: string | null) {
  const accountNumberVariants = new Set<string>();
  const normalizedAccountType = accountType?.trim() || getEnv(
    "SLIP2GO_RECEIVER_ACCOUNT_TYPE",
    "03000",
  );

  for (const accountNumber of accountNumbers ?? []) {
    const trimmed = accountNumber.trim();
    if (!trimmed) continue;

    accountNumberVariants.add(trimmed);

    const digitsOnly = trimmed.replace(/\D/g, "");
    if (!digitsOnly || digitsOnly === trimmed) continue;

    accountNumberVariants.add(digitsOnly);
    if (digitsOnly.length === 10) {
      accountNumberVariants.add(
        `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 9)}-${digitsOnly.slice(9)}`,
      );
    }
  }

  const checkReceiver = Array.from(accountNumberVariants).map((accountNumber) => ({
    accountType: normalizedAccountType,
    accountNumber,
  }));

  return checkReceiver.length > 0
    ? { checkCondition: { checkReceiver } }
    : {};
}

function summarizeRaw(value: unknown) {
  const text =
    typeof value === "string" ? value : JSON.stringify(value ?? null, null, 2);
  return text.length > 600 ? `${text.slice(0, 600)}...` : text;
}

export async function verifySlipWithSlip2Go(
  input: Slip2GoVerificationInput,
): Promise<Slip2GoVerificationResult> {
  if (!isSlip2GoConfigured()) {
    throw new Error("SLIP2GO_API_URL or SLIP2GO_API_BASE_URL is not configured.");
  }

  const startedAt = Date.now();
  const configuredMode = getEnv("SLIP2GO_REQUEST_MODE", "auto").toLowerCase();
  const qrField = getEnv("SLIP2GO_QR_FIELD", "qrCode");
  const imageField = getEnv("SLIP2GO_IMAGE_FIELD", "file");
  const base64Field = getEnv("SLIP2GO_BASE64_FIELD", "imageBase64");
  const miniQrPayload = input.miniQrPayload?.trim() || "";
  const mode = resolveRequestMode(configuredMode, Boolean(miniQrPayload));
  const endpoint = resolveEndpoint(mode);
  const receiverCheckPayload = buildReceiverCheck(
    input.receiverAccountNumbers,
    input.receiverAccountType,
  );

  const headers: HeadersInit = authHeaders();
  let body: BodyInit;

  if (mode === "qr-code") {
    if (!miniQrPayload) {
      throw new Error(
        "Slip2Go qr-code verification requires a QR payload from the uploaded slip.",
      );
    }

    headers["Content-Type"] = "application/json";
    body = JSON.stringify({
      payload: {
        [qrField]: miniQrPayload,
        ...receiverCheckPayload,
      },
    });
  } else if (mode === "base64") {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify({
      payload: {
        [base64Field]: dataUrlBase64(input.slipContentType, input.slipBytes),
        ...receiverCheckPayload,
      },
    });
  } else if (mode === "qr-image") {
    const formData = new FormData();
    const fileBuffer = new ArrayBuffer(input.slipBytes.byteLength);
    new Uint8Array(fileBuffer).set(input.slipBytes);
    formData.set(
      imageField,
      new Blob([fileBuffer], { type: input.slipContentType }),
      input.slipFileName,
    );
    if (Object.keys(receiverCheckPayload).length > 0) {
      formData.set("payload", JSON.stringify(receiverCheckPayload));
    }
    body = formData;
  } else {
    throw new Error(
      `Unsupported SLIP2GO_REQUEST_MODE "${configuredMode}". Use auto, qr-code, qr-image, base64, json, or multipart.`,
    );
  }

  console.log("[slip2go] verifying slip", {
    endpoint,
    mode,
    hasMiniQrPayload: Boolean(miniQrPayload),
    fileName: input.slipFileName,
    contentType: input.slipContentType,
    sizeBytes: input.slipBytes.byteLength,
    hasReceiverCheck: Object.keys(receiverCheckPayload).length > 0,
    receiverAccountCount: input.receiverAccountNumbers?.filter((item) =>
      item.trim(),
    ).length ?? 0,
    authHeader: getEnv("SLIP2GO_AUTH_HEADER", "Authorization"),
  });

  const response = await fetch(endpoint, {
    method: getEnv("SLIP2GO_METHOD", "POST"),
    headers,
    body,
    cache: "no-store",
  });
  const raw = await parseResponse(response);
  const verified = inferVerified(response.ok, raw);
  const status = inferStatus(raw, response.ok);
  const message = inferMessage(raw);
  const responseSummary = summarizeRaw(raw);

  if (!response.ok) {
    console.warn("[slip2go] verification request failed", {
      endpoint,
      mode,
      httpStatus: response.status,
      response: responseSummary,
      durationMs: Date.now() - startedAt,
    });
  }

  return {
    ok: response.ok,
    verified,
    status,
    message,
    httpStatus: response.status,
    endpoint,
    requestMode: mode,
    transRef: inferTransRef(raw),
    amountThb: inferAmountThb(raw),
    raw,
    error: response.ok
      ? null
      : `Slip2Go returned HTTP ${response.status}: ${responseSummary}`,
    durationMs: Date.now() - startedAt,
  };
}
