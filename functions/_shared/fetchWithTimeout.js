// Bound upstream requests made by Cloudflare Pages Functions.
// Preserve an existing caller cancellation signal while enforcing a hard deadline.
export async function fetchWithTimeout(input, init = {}, timeoutMs = 8000) {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = init.signal
    ? AbortSignal.any([init.signal, timeoutSignal])
    : timeoutSignal;
  return fetch(input, { ...init, signal });
}
