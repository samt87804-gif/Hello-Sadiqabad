// Bound upstream requests made by Cloudflare Pages Functions.
// Preserve caller cancellation while enforcing a hard request deadline.
export async function fetchWithTimeout(input, init = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const callerSignal = init.signal;
  const abortFromCaller = () => controller.abort(callerSignal.reason);

  if (callerSignal?.aborted) abortFromCaller();
  else callerSignal?.addEventListener('abort', abortFromCaller, { once: true });

  const timeout = setTimeout(() => {
    controller.abort(new DOMException('Upstream request timed out.', 'TimeoutError'));
  }, timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
    callerSignal?.removeEventListener('abort', abortFromCaller);
  }
}
