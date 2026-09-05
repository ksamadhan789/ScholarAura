import dns from "dns/promises";
import net from "net";

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true;
  const [a, b] = parts;
  if (a === 0) return true; // "this network"
  if (a === 10) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata (169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 0) return true; // IETF protocol assignments
  if (a === 192 && b === 168) return true;
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true; // multicast + reserved
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;
  if (/^fe[89ab]/.test(normalized)) return true; // fe80::/10 link-local
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // fc00::/7 unique local
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return false;
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  if (net.isIPv6(ip)) return isPrivateIPv6(ip);
  return true; // unrecognized — treat as unsafe
}

/**
 * Guards a server-initiated fetch to a user-supplied URL (e.g. an
 * instructor's certificate logo). Without this, anything that fetches such
 * a URL on the platform's behalf is a blind SSRF vector — a lower-privilege
 * user could point it at an internal service or a cloud metadata endpoint
 * (169.254.169.254) and read the response indirectly. Resolves the hostname
 * and rejects loopback/private/link-local/reserved destinations.
 */
export async function assertSafeExternalUrl(rawUrl: string): Promise<void> {
  const url = new URL(rawUrl);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Unsupported URL scheme: ${url.protocol}`);
  }

  const hostname = url.hostname;
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error("URL resolves to a disallowed address");
    return;
  }

  const records = await dns.lookup(hostname, { all: true });
  if (records.length === 0 || records.some((r) => isPrivateIp(r.address))) {
    throw new Error("URL resolves to a disallowed address");
  }
}
