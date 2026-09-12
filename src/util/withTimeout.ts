/**
 * Race a promise against a timeout. Rejects with a descriptive error if the
 * promise doesn't settle in time — used to keep the UI from hanging forever
 * when bb.js WASM fails to load or proof generation stalls.
 */

export const PROOF_TIMEOUT_MS = 120_000;

export function withTimeout<T>(
  promise: Promise<T>,
  label: string,
  ms: number = PROOF_TIMEOUT_MS,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(
          new Error(
            `${label} timed out after ${ms / 1000}s — try reloading the page`,
          ),
        ),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err instanceof Error ? err : new Error(String(err)));
      },
    );
  });
}
