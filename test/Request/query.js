
// 3rd
import test from 'ava'
// 1st
import { Request } from '../../lib'
import { nreq } from '../_helpers'

test('when no url querystring, returns {}', t => {
  const request = Request.fromNode(nreq({ url: '/' }))
  t.same(request.query, {})
})

test('parses url querystring', t => {
  const request = Request.fromNode(nreq({ url: '/?foo=42' }))
  t.same(request.query, { foo: '42' })
})

test('supports nested syntax', t => {
  const request = Request.fromNode(nreq({ url: '/?user[uname]=foo&user[password]=secret' }))
  t.same(request.query, { user: { uname: 'foo', password: 'secret' } })
})
