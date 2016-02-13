
// 3rd
import Immutable from 'immutable'
import R from 'ramda'
// 1st
import { Response, compose } from '..'

//
// cobbled together a quick router
//

// TODO: Clean up this lulzy impl

function crawl (tree, segments) {
  const nextNodeData = (node, segment) => {
    // static route
    if (node.has(segment)) return { node: node.get(segment), param: {} }
    // try wildcard. a node can only have one
    const wildcard = node.keySeq().find((k) => k.startsWith('/:')) // string or undef
    if (!wildcard) return false
    const nextNode = node.get(wildcard)
    // wildcard could be '/:uname'
    const paramKey = wildcard.match(/\/:([a-z0-9_-]+)/i)[1]
    const paramVal = segment.substr(1) // remove leading slash
    return { node: nextNode, param: { [paramKey]: paramVal } }
  }
  const initState = Immutable.fromJS({
    node: tree,
    mws: [],
    params: {}
  })
  const reducer = (state, segment) => {
    const data = nextNodeData(state.get('node'), segment)
    if (!data) return R.reduced(false) // 404
    return state
      .set('node', data.node)
      .update('mws', (mws) => mws.concat(data.node.get('middleware') || []))
      .update('params', (old) => old.merge(data.param))
  }

  return R.reduce(reducer, initState, segments)
}

// String -> [String]
export const intoSegments = R.compose(
  R.map((s) => '/' + s),
  R.split('/'),
  R.replace(/\/*$/, '')
)

function handle (tree, request) {
  if (R.either(R.isNil, R.isEmpty)(tree)) return Response.notFound()
  const segments = intoSegments(request.path)
  const hit = crawl(tree, segments)
  if (!hit) return Response.notFound()
  if (!hit.get('node').has(request.method)) return Response.notFound()
  const handler = hit.get('node').get(request.method)
  const middleware = compose(...hit.get('mws').toArray())
  return middleware(handler)(request.setIn(['state', 'params'], hit.get('params')))
}

// RouteTree -> Handler
function router (tree) {
  tree = Immutable.fromJS(tree)
  return function newHandler (request) {
    return handle(tree, request)
  }
}

// PUBLIC API

export default router
