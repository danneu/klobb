
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
export function createError (status, message, orig) {
  // Handle createError(500, err)
  if (message instanceof Error) {
    orig = message
    message = undefined
  }
  const err = new Error(message)
  err.status = status
  err.originalError = orig
  return err
}

export function escapeHtml (html) {
  return String(html)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
