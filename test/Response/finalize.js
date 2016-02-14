
// 3rd
import test from 'ava'
// 1st
import { Response } from '../../lib'

function stripTest (t, status) {
  const headers = {
    'content-type': 'text/plain',
    'content-length': '3',
    'transfer-encoding': 'chunked'
  }
  const response = Response.make(status, headers, 'foo')
    .finalize()

  t.same(response.body, '')
  t.same(response.getHeader('content-type'), undefined)
  t.same(response.getHeader('content-length'), '0')
  t.same(response.getHeader('transfer-encoding'), undefined)
}

test('strips content on contentless status codes', t => {
  stripTest(t, 204)
  stripTest(t, 205)
  stripTest(t, 304)
})
