// Client-side fetch wrapper. Vercel returns an HTML error page when a
// serverless function crashes or hits FUNCTION_INVOCATION_TIMEOUT (300s
// hard ceiling on Pro). The standard `await res.json()` pattern chokes
// on that with "Unexpected token A, An error o... is not valid JSON" —
// exposing a raw browser parser error to paying customers.
//
// This helper detects HTML responses + JSON parse failures and converts
// both into a friendly Error the caller can surface. Preserves the
// status code for callers that want to differentiate (e.g. 429 ≠ 500).
//
// Usage:
//   const data = await fetchJson<{ imageId: string }>("/api/generate", {
//     method: "POST",
//     body: formData,
//   });
//
// Throws:
//   FetchJsonError with .status, .message, and .isUserFriendly = true.

export class FetchJsonError extends Error {
  status: number;
  /** True when message is safe to show to end-users verbatim. */
  isUserFriendly: boolean;
  constructor(message: string, status: number, isUserFriendly: boolean) {
    super(message);
    this.name = "FetchJsonError";
    this.status = status;
    this.isUserFriendly = isUserFriendly;
  }
}

const FRIENDLY_TIMEOUT_MSG =
  "This is taking longer than usual — our AI is under heavy load right now. Please try again with a clearer or smaller photo. (Tip: photos under 5MB and well-lit faces generate fastest.)";

const FRIENDLY_RATE_LIMIT_MSG =
  "Too many tries in a row — please wait a moment and try again.";

const FRIENDLY_GENERIC_MSG =
  "Something went wrong on our end. Please try again, and if it keeps happening, email cosmic.company.llc@gmail.com.";

export async function fetchJson<T = unknown>(
  url: string,
  init?: RequestInit
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new FetchJsonError(
      "Couldn't reach the server. Check your internet connection and try again.",
      0,
      true
    );
  }

  // Detect Vercel's branded HTML error pages (FUNCTION_INVOCATION_FAILED,
  // FUNCTION_INVOCATION_TIMEOUT, BODY_NOT_A_STRING_FROM_FUNCTION, etc).
  // Pattern: 5xx status + Content-Type: text/html. Our own routes
  // always return application/json even on errors, so a text/html
  // response is unambiguously a Vercel platform failure.
  const contentType = res.headers.get("content-type") || "";
  const isHtml = contentType.includes("text/html");

  if (isHtml) {
    // Peek the body to distinguish timeout from generic crash so we
    // can give a more specific friendly message.
    const body = await res.text().catch(() => "");
    if (
      body.includes("FUNCTION_INVOCATION_TIMEOUT") ||
      body.includes("timeout") ||
      res.status === 504
    ) {
      throw new FetchJsonError(FRIENDLY_TIMEOUT_MSG, res.status, true);
    }
    throw new FetchJsonError(FRIENDLY_GENERIC_MSG, res.status, true);
  }

  // Rate-limit short-circuit. Our own routes return JSON for 429s but
  // the message we ship from the server may not be the most polished
  // copy for end-users; surface a consistent friendly one.
  if (res.status === 429) {
    throw new FetchJsonError(FRIENDLY_RATE_LIMIT_MSG, 429, true);
  }

  // Parse the JSON body. Any parse failure here is unexpected — our
  // routes always serialize JSON — but if it happens, treat it as a
  // generic server error.
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new FetchJsonError(FRIENDLY_GENERIC_MSG, res.status, true);
  }

  if (!res.ok) {
    // Server returned a JSON error body. Use its error message if
    // present, otherwise fall back to generic.
    const serverMessage =
      typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : null;
    throw new FetchJsonError(
      serverMessage || FRIENDLY_GENERIC_MSG,
      res.status,
      !!serverMessage
    );
  }

  return data as T;
}
