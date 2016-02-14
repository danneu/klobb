
// 3rd
import test from 'ava'
// 1st
import { Request } from '../../lib'
import { nreq } from '../_helpers'

test('returns field value or undefined', t => {
  const request = Request.fromNode(nreq({
    headers: {
      'host': 'http://example.com',
      'referer': 'http://example.com'
    }
  }))
  t.same(request.getHeader('HOST'), 'http://example.com')
  t.same(request.getHeader('Host'), 'http://example.com')
  t.same(request.getHeader('host'), 'http://example.com')
  t.same(request.getHeader('referer'), 'http://example.com')
  t.same(request.getHeader('referrer'), 'http://example.com')
  t.same(request.getHeader('x-not-here'), undefined)
})
