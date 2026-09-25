import { z } from "zod";

/**
 * True only for absolute http(s) URLs. `new URL()` and zod's `.url()` also
 * accept `javascript:` / `data:` URLs, which would run script when rendered
 * as a link's href — every user-supplied link must go through this.
 */
export function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/** zod schema for a user-supplied web link: a valid http(s) URL. */
export function httpUrl(message = "Enter a valid URL") {
  return z.string().trim().url(message).refine(isHttpUrl, "Only http:// or https:// links are allowed");
}
