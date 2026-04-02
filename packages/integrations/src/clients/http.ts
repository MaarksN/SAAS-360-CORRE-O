export interface HttpRequestOptions {
  apiKey?: string;
  body?: BodyInit;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  headers?: Record<string, string>;
}

export class HttpRequestError extends Error {
  readonly attempt: number;
  readonly method: string;
  readonly retryable: boolean;
  readonly status: number | null;
  readonly timedOut: boolean;
  readonly url: string;

  constructor(
    message: string,
    input: {
      attempt: number;
      method: string;
      retryable: boolean;
      status?: number | null;
      timedOut?: boolean;
      url: string;
    },
  ) {
    super(message);
    this.name = "HttpRequestError";
    this.attempt = input.attempt;
    this.method = input.method;
    this.retryable = input.retryable;
    this.status = input.status ?? null;
    this.timedOut = input.timedOut ?? false;
    this.url = input.url;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function toHttpRequestError(
  error: unknown,
  input: {
    attempt: number;
    method: string;
    timeoutMs: number;
    url: string;
  },
): HttpRequestError {
  if (error instanceof HttpRequestError) {
    return error;
  }

  if (isAbortError(error)) {
    return new HttpRequestError(`HTTP ${input.method} ${input.url} timed out after ${input.timeoutMs}ms`, {
      attempt: input.attempt,
      method: input.method,
      retryable: true,
      timedOut: true,
      url: input.url
    });
  }

  const detail = error instanceof Error ? error.message : "Unknown network error";
  return new HttpRequestError(`HTTP ${input.method} ${input.url} failed: ${detail}`, {
    attempt: input.attempt,
    method: input.method,
    retryable: true,
    url: input.url
  });
}

async function requestJson<T>(
  method: "GET" | "POST",
  url: string,
  options: HttpRequestOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const retries = options.retries ?? 2;
  const retryDelayMs = options.retryDelayMs ?? 250;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "user-agent": "birthub-integrations/1.0",
          ...(options.apiKey ? { authorization: `Bearer ${options.apiKey}` } : {}),
          ...(options.headers ?? {}),
        },
        ...(method === "POST"
          ? {
              body:
                options.body ??
                JSON.stringify(null),
              headers: {
                "content-type": "application/json",
                "user-agent": "birthub-integrations/1.0",
                ...(options.apiKey ? { authorization: `Bearer ${options.apiKey}` } : {}),
                ...(options.headers ?? {}),
              }
            }
          : {}),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const body = await response.text();
        const retryable = isRetryableStatus(response.status);
        const error = new HttpRequestError(
          `HTTP ${method} ${url} failed with status ${response.status}: ${body || "Empty response body"}`,
          {
            attempt: attempt + 1,
            method,
            retryable,
            status: response.status,
            url
          }
        );
        if (attempt < retries && isRetryableStatus(response.status)) {
          lastError = error;
          await sleep(retryDelayMs * (attempt + 1));
          continue;
        }
        throw error;
      }

      const body = await response.text();
      return (body.length > 0 ? (JSON.parse(body) as T) : (undefined as T));
    } catch (error) {
      const requestError = toHttpRequestError(error, {
        attempt: attempt + 1,
        method,
        timeoutMs,
        url
      });
      lastError = requestError;

      if (attempt < retries && requestError.retryable) {
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to call external API");
}

export async function getJson<T>(
  url: string,
  options: HttpRequestOptions = {},
): Promise<T> {
  return requestJson<T>("GET", url, options);
}

export async function postJson<T>(
  url: string,
  payload: unknown,
  options: HttpRequestOptions = {},
): Promise<T> {
  return requestJson<T>("POST", url, {
    ...options,
    body: options.body ?? JSON.stringify(payload)
  });
}
