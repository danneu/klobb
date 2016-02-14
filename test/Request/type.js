
// 3rd
import test from 'ava'
// 1st
import { Request } from '../../lib'
import { nreq } from '../_helpers'

test('returns content-type without charset', t => {
  const request = Request.fromNode(nreq({
    headers: { 'content-type': 'text/html; charset=utf-8' }
  }))
  t.same(request.type, 'text/html')
})

test('if no content-type, returns ""', t => {
  const request = Request.fromNode(nreq())
  t.same(request.type, '')
})
