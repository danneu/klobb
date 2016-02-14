
// 3rd
import test from 'ava'
// 1st
import { Response } from '../../lib'

test('works', t => {
  const response = Response.ok()
    .setHeader('x-test', 'a')
  t.same(response.getIn(['headers', 'x-test']), 'a')
})

test('deletes header if val is nil', t => {
  const headers = {
    'x-aaa': 'a',
    'x-bbb': 'b',
    'x-ccc': 'c'
  }
  const response = Response.make(200, headers)
    .setHeader('x-aaa', undefined)
    .setHeader('x-bbb', null)
  t.same(response.hasIn(['headers', 'x-aaa']), false)
  t.same(response.hasIn(['headers', 'x-bbb']), false)
  t.same(response.getIn(['headers', 'x-ccc']), 'c')
})

test('coerces one val to string', t => {
  const response = Response.ok()
    .setHeader('x-test', 42)
  t.same(response.getIn(['headers', 'x-test']), '42')
})

test('coerces array of vals to strings', t => {
  const response = Response.ok()
    .setHeader('x-test', [1, 2, 3])
  t.same(response.getIn(['headers', 'x-test']), ['1', '2', '3'])
})
