export type TransientObservationErrorCode = "state_changed_during_composite_read";

/**
 * A coherent snapshot could not be assembled because the game advanced while
 * read-only sidecars were being captured. Callers may retry observation, but
 * must never use partial evidence or treat the error as action authorization.
 */
export class TransientObservationError extends Error {
  readonly code: TransientObservationErrorCode;

  constructor(code: TransientObservationErrorCode, message: string) {
    super(message);
    this.name = "TransientObservationError";
    this.code = code;
  }
}
