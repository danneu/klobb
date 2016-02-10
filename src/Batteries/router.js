
// 3rd
import Immutable from 'immutable';
import R from 'ramda';
// 1st
import { Response, compose } from '..';

//
// cobbled together a quick router
//

// Usage:
//
// const handler = router({
//   '/': {
//     middleware: [],
//     GET: () => Response.ok('GET /'),
//     kids: {
//       '/:foo': {
//         GET: async (request) => {
//           Response.ok(request.getIn(['state', 'params']))
//         }
//       }
//       '/test': {
//         GET: async () => Response.ok('GET /test'),
//         kids: {
//           middleware: [],
//           '/foo': {
//             kids: {
//               '/bar': {
//                 kids: {
//                   '/baz': {
//                     GET: () => Response.ok('GET /test/foo/bar/baz'),
//                   }
//                 }
//               }
//             }
//           }
//         }
//       }
//     }
//   }
// });

// TODO: Clean up this lulzy impl

function crawl(tree, segments) {
  const nextNodeData = (node, segment) => {
    // static route
    if (node.has(segment)) return { node: node.get(segment), param: {} };
    // if segment doesn't start with '/', llike if it's 'kids',
    // then we don't look for a wildcard match
    if (!segment.startsWith('/')) return false;
    // try wildcard. a node can only have one
    const wildcard = node.keySeq().find(k => k.startsWith('/:')); // string or undef
    if (!wildcard) return false;
    const nextNode = node.get(wildcard);
    // wildcard could be '/:uname'
    const paramKey = wildcard.match(/\/:([a-z0-9_-]+)/i)[1];
    const paramVal = segment.substr(1); // remove leading slash
    return { node: nextNode, param: { [paramKey]: paramVal } };
  };
  const initState = {
    node: tree,
    mws: new Immutable.List(),
    params: new Immutable.Map()
  };
  const reducer = (state, segment) => {
    const data = nextNodeData(state.node, segment);
    if (!data) return R.reduced(false); // 404
    // data is { node, params: {} || undefined }
    const newNode = data.node;
    const newMws = state.mws.concat(data.node.get('middleware') || []);
    const newParams = state.params.merge(data.param);
    return { mws: newMws, node: newNode, params: newParams };
  };

  return R.reduce(reducer, initState, segments);
}

function handle(tree, request) {
  const segments = R.compose(
    R.intersperse('kids'),
    R.map(s => '/' + s),
    R.split('/'),
    s => s.replace(/\/*$/, '') // nuke trailing comma
  )(request.path);

  const hit = crawl(tree, segments);
  if (!hit) return Response.notFound();
  if (!hit.node.has(request.method)) return Response.notFound();

  const handler = hit.node.get(request.method);
  const middleware = compose(...hit.mws.toArray());
  return middleware(handler)(request.setIn(['state', 'params'], hit.params));
}

// RouteTree -> Handler
function router(tree) {
  tree = Immutable.fromJS(tree);
  return function newHandler(request) {
    return handle(tree, request);
  }
}

////////////////////////////////////////////////////////////
// Public API
////////////////////////////////////////////////////////////

export default router;
