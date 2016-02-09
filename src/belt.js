
// 3rd
import statuses from 'statuses';

//
// Common utility belt functions available across modules
//

// Create an error to be thrown. Will be caught at top-level onError handler.
//
// Ex:
//
//     createError(500)
//     createError(500, err)
//     createError(500, 'Custom message')
//     createError(500, 'Custom message', err)
//
export function createError(status, message, orig) {
  // Handle createError(500, err)
  if (message instanceof Error) {
    orig = message;
    message = undefined;
  }
  const err = new Error(message || statuses[status]);
  err.status = status;
  err.originalError = orig;
  return err;
}
