
import R from 'ramda';
import { Response } from '..';

// SpecObject -> Handler
function negotiate(spec) {
  const mimePairs = R.toPairs(spec).filter(([k]) => k !== 'default');
  const matchHandler = request => {
    const pair = R.find(([k]) => request.accepts(k))(mimePairs);
    return pair && pair[1];
  };
  return function newHandler(request) {
    const handler = matchHandler(request)
      || spec.default
      || (() => Response.make(406));
    return handler(request);
  }
}

export default negotiate;
