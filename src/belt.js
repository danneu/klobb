
//
// Common utility belt functions available across modules
//

// Create an error to be thrown. Will be caught at top-level onError handler.
export function createError(status, message, orig) {
  const err = new Error(message);
  err.statusCode = status;
  err.originalError = orig;
  return err;
}
