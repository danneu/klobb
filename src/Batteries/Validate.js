
// 3rd
import Immutable from 'immutable'
import R from 'ramda'
import _ from 'lodash'
import { isEmail } from 'validator'

//
// This sloppy namespace is here to hack together a basic
// validation library so that I can implement a klobb clone
// of my koa-bouncer project.
//

// =========================================================
// Custom error

function ValidationError (key, message) {
  this.name = 'ValidationError'
  this.message = message
  this.validation = {
    key: key,
    message: message
  }
}
ValidationError.prototype = _.create(Error.prototype)

function makeError (key, tip) {
  return new ValidationError(key, tip || `Invalid value for ${key}`)
}

// =========================================================

// Reduces to a state where memo.err is either set or not set,
// which is what we care about. memo.value has the xformed val
// we should assoc into vals.
function reducer (memo, fn) {
  const next = fn(memo)
  if (next.err) return R.reduced(next)
  return next
}

const Validate = {
  validateBody: function (req, spec) {
    const vals = {}
    for (let [key, fns] of R.toPairs(spec)) {
      // TODO: Decide on the range of possibile body value. atm
      // I have no idea.
      const initVal = Immutable.Map.isMap(req.body)
        ? req.body.get(key)
        : (_.isPlainObject(req.body) ? req.body[key] : undefined)
      const initMemo = {
        key: key,
        val: initVal,
        err: undefined,
        tip: `Invalid value for ${key}`,
        isRequired: true, // I don't think I use this one
        // reference lets other reductions see processed state of other keys
        vals: vals
      }
      const result = R.reduce(reducer, initMemo, fns)
      if (result.err) throw result.err
      vals[key] = result.val
    }
    return vals
  }
}

// These step the reducer
//
// memo: { val: _, tip: '', err: _, key: _, isRequired: true }
const v = {
  // Update tip for downstream stuff until something else changes it
  tip: (newTip) => {
    return (memo) => {
      return R.merge(memo, { tip: newTip })
    }
  },
  required: (tip) => {
    return (memo) => {
      memo = R.merge(memo, { isRequired: true })
      if (memo.val !== undefined) return memo
      return R.merge(memo, { err: makeError(memo.key, tip || memo.tip) })
    }
  },
  optional: () => {
    return (memo) => {
      memo = R.merge(memo, { isRequired: false })
      // if val is undefined or empty string, then short-circuit
      if (memo.val === undefined || memo.val === '') return R.reduced(memo)
      return memo
    }
  },
  isString: (tip) => {
    return (memo) => {
      if (typeof memo.val === 'string') return memo
      return R.merge(memo, { err: makeError(memo.key, tip || memo.tip) })
    }
  },
  toInteger: (tip) => {
    return (memo) => {
      const parsed = Number.parseInt(memo.val, 10)
      // fail
      if (!Number.isInteger(parsed)) {
        return R.merge(memo, { err: makeError(memo.key, tip || memo.tip) })
      }
      // Ensure it wasn't something like '23abc' parsing into 23, which
      // we don't want to accept as valid. Maybe have a strict=true option?
      if (parsed.toString() !== memo.val) {
        return R.merge(memo, { err: makeError(memo.key, tip || memo.tip) })
      }
      // pass
      return R.merge(memo, { val: parsed })
    }
  },
  isInteger: (tip) => {
    return (memo) => {
      if (Number.isInteger(memo.val)) return memo
      return R.merge(memo, { err: makeError(memo.key, tip || memo.tip) })
    }
  },
  checkPred: (pred, tip) => {
    return (memo) => {
      // pass
      if (pred(memo.val)) return memo
      // fail
      return R.merge(memo, { err: makeError(memo.key, tip || memo.tip) })
    }
  },
  // arbitrarily change value, fn gets old value, should return a new one
  tap: (fn) => {
    return (memo) => {
      return R.merge(memo, { val: fn(memo.val) })
    }
  },
  match: (re, tip) => {
    return (memo) => {
      // pass
      if (re.test(memo.val)) return memo
      // fail
      return R.merge(memo, { err: makeError(memo.key, tip || memo.tip) })
    }
  },
  notMatch: (re, tip) => {
    return (memo) => {
      // pass
      if (!re.test(memo.val)) return memo
      // fail
      return R.merge(memo, { err: makeError(memo.key, tip || memo.tip) })
    }
  },
  check: (result, tip) => {
    return (memo) => {
      // pass
      if (result) return memo
      // fail
      return R.merge(memo, { err: makeError(memo.key, tip || memo.tip) })
    }
  },
  checkNot: (result, tip) => {
    return (memo) => {
      // pass
      if (!result) return memo
      // fail
      return R.merge(memo, { err: makeError(memo.key, tip || memo.tip) })
    }
  },
  isLength: (min, max, tip) => {
    return (memo) => {
      // pass
      const len = memo.val.length
      if (len >= min && len <= max) return memo
      // fail
      return R.merge(memo, { err: makeError(memo.key, tip || memo.tip) })
    }
  },
  trim: () => {
    return (memo) => {
      return R.merge(memo, { val: memo.val.trim() })
    }
  },
  // assert something against the memo
  checkPredMemo: (pred, tip) => {
    return (memo) => {
      // pass
      if (pred(memo)) return memo
      // fail
      return R.merge(memo, { err: makeError(memo.key, tip || memo.tip) })
    }
  },
  checkNotPredMemo: (pred, tip) => {
    return (memo) => {
      // pass
      if (!pred(memo)) return memo
      // fail
      return R.merge(memo, { err: makeError(memo.key, tip || memo.tip) })
    }
  },
  isEmail: (tip) => {
    return (memo) => {
      // pass
      if (isEmail(memo.val)) return memo
      // fail
      return R.merge(memo, { err: makeError(memo.key, tip || memo.tip) })
    }
  }
}

export { Validate, v, ValidationError }
