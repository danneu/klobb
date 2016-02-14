
// 3rd
import test from 'ava'
// 1st
import { Response } from '../../lib'

// CONTENT-TYPE ALREADY SET

test('uses content-type if already set', t => {
  const response = Response.make(200, {
    'content-type': 'text/csv'
  }, 'foo').finalize()
  t.same(response.getHeader('content-type'), 'text/csv; charset=utf-8')
})

// CONTENT-TYPE NOT SET

test('sets content-type to text at the very least', t => {
  const response = Response.ok('foo').finalize()
  t.same(response.getHeader('content-type'), 'text/plain; charset=utf-8')
})

test('guesses content-type html', t => {
  const response = Response.ok('<h1>foo</h1>').finalize()
  t.same(response.getHeader('content-type'), 'text/html; charset=utf-8')
})

test('sets buffer body type to application/octet-stream', t => {
  const response = Response.ok(Buffer('foo')).finalize()
  t.same(response.getHeader('content-type'), 'application/octet-stream')
})

// STRIP

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
