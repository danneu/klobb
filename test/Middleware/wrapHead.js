
// 3rd
import test from 'ava'
// 1st
import { Request, Response, Middleware } from '../../lib'
import { nreq } from '../_helpers'

test('strips body from HEAD responses', async t => {
  const request = Request.fromNode(nreq({ method: 'HEAD' }))
  const route = () => Response.ok('hello')
  const handler = Middleware.wrapHead()(route)

  let response = (await handler(request)).finalize()
  t.same(response.body, '')
  t.same(response.getHeader('content-length'), '0')
})

test('does not affect GET responses', async t => {
  const request = Request.fromNode(nreq({ method: 'GET' }))
  const route = () => Response.ok('hello')
  const handler = Middleware.wrapHead()(route)

  let response = (await handler(request)).finalize()
  t.same(response.body, 'hello')
  t.same(response.getHeader('content-length'), '5')
})
