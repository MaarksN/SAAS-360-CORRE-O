import { isIP } from "node:net";

const blockedHostnames = new Set([
  "0.0.0.0",
  "::",
  "::1",
  "host.docker.internal",
  "kubernetes.default",
  "kubernetes.default.svc",
  "localhost",
  "metadata",
  "metadata.google.internal"
]);

function normalizeHostname(hostname: string): string {
  return hostname.replace(/^\[|\]$/g, "").trim().toLowerCase();
}

function isLocalDevelopmentHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function isPrivateIpv4(hostname: string): boolean {
  const octets = hostname.split(".").map((part) => Number.parseInt(part, 10));

  if (octets.length !== 4 || octets.some((octet) => Number.isNaN(octet) || octet < 0 || octet > 255)) {
    return false;
  }

  const first = octets[0];
  const second = octets[1];

  if (first === undefined || second === undefined) {
    return false;
  }

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function isPrivateIpv6(hostname: string): boolean {
  const normalized = normalizeHostname(hostname);

  if (normalized === "::" || normalized === "::1") {
    return true;
  }

  if (normalized.startsWith("::ffff:")) {
    return isPrivateIpv4(normalized.slice("::ffff:".length));
  }

  return (
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

function isInternalHostname(hostname: string): boolean {
  return (
    blockedHostnames.has(hostname) ||
    hostname.endsWith(".cluster.local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".localdomain") ||
    hostname.endsWith(".svc")
  );
}

export interface ExternalUrlValidationOptions {
  allowLocalDevelopmentUrls?: boolean;
  requireHttps?: boolean;
}

export interface ExternalUrlValidationResult {
  ok: boolean;
  reason?: string;
  url?: URL;
}

export function validateExternalUrl(
  rawUrl: string,
  options: ExternalUrlValidationOptions = {}
): ExternalUrlValidationResult {
  const allowLocalDevelopmentUrls = options.allowLocalDevelopmentUrls ?? false;
  const requireHttps = options.requireHttps ?? false;

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return {
      ok: false,
      reason: "URL is invalid."
    };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return {
      ok: false,
      reason: "Only HTTP(S) URLs are allowed."
    };
  }

  if (parsed.username || parsed.password) {
    return {
      ok: false,
      reason: "Embedded credentials are not allowed in external URLs."
    };
  }

  const hostname = normalizeHostname(parsed.hostname);
  const localDevelopmentUrl = allowLocalDevelopmentUrls && isLocalDevelopmentHost(hostname);

  if (!localDevelopmentUrl && isInternalHostname(hostname)) {
    return {
      ok: false,
      reason: "Internal, loopback or metadata endpoints are not allowed."
    };
  }

  const ipVersion = isIP(hostname);
  if (!localDevelopmentUrl && ipVersion === 4 && isPrivateIpv4(hostname)) {
    return {
      ok: false,
      reason: "Private or link-local IPv4 addresses are not allowed."
    };
  }

  if (!localDevelopmentUrl && ipVersion === 6 && isPrivateIpv6(hostname)) {
    return {
      ok: false,
      reason: "Private, loopback or link-local IPv6 addresses are not allowed."
    };
  }

  if (requireHttps && parsed.protocol !== "https:" && !localDevelopmentUrl) {
    return {
      ok: false,
      reason: "HTTPS is required for external URLs."
    };
  }

  return {
    ok: true,
    url: parsed
  };
}
