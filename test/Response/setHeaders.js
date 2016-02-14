
// 3rd
import test from 'ava'
// 1st
import { Response } from '../../lib'

test('sets multiple headers', t => {
  const response = Response.ok()
    .setHeaders({
      'x-aaa': 'a',
      'x-bbb': 'b'
    })
  t.same(response.getIn(['headers', 'x-aaa']), 'a')
  t.same(response.getIn(['headers', 'x-bbb']), 'b')
})

test('overrides existing headers', t => {
  const response = Response.make(200, {
    'x-aaa': 'a', 'x-bbb': 'b'
  }).setHeaders({ 'x-aaa': 'a2' })
  t.same(response.getIn(['headers', 'x-aaa']), 'a2')
  t.same(response.getIn(['headers', 'x-bbb']), 'b')
})

test('coerces vals to strings', t => {
  const response = Response.ok()
    .setHeaders({ 'x-test': 42 })
  t.same(response.getIn(['headers', 'x-test']), '42')
})

test('coerces array vals to strings', t => {
  const response = Response.ok()
    .setHeaders({ 'x-test': [1, 2, 3] })
  t.same(response.getIn(['headers', 'x-test']).toJS(), ['1', '2', '3'])
})
