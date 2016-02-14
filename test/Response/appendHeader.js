
// 3rd
import test from 'ava'
// 1st
import { Response } from '../../lib'

test('works with string val argument', t => {
  const response = new Response()
    .appendHeader('x-test', 'val')
  t.same(response.getHeader('x-test').toJS(), ['val'])
})

test('works with string val argument and when existing header val is string', t => {
  const response = new Response()
    .setHeader('x-test', 'existing')
    .appendHeader('x-test', 'val')
  t.same(response.getHeader('x-test').toJS(), ['existing', 'val'])
})

test('works with array val argument', t => {
  const response = new Response()
    .appendHeader('x-test', ['val1', 'val2'])
  t.same(response.getHeader('x-test').toJS(), ['val1', 'val2'])
})

test('works with array val argument and when existing header val is array', t => {
  const response = new Response()
    .setHeader('x-test', ['a', 'b'])
    .appendHeader('x-test', ['c', 'd'])
  t.same(response.getHeader('x-test').toJS(), ['a', 'b', 'c', 'd'])
})

test('does not merge nil vals', t => {
  const response = new Response()
    .appendHeader('x-test', ['a', null, 'b', undefined])
  t.same(response.getHeader('x-test').toJS(), ['a', 'b'])
})

test('can be called multiple times', t => {
  const response = new Response()
    .appendHeader('x-test', 'a')
    .appendHeader('x-test', 'b')
  t.same(response.getHeader('x-test').toJS(), ['a', 'b'])
})

test('gets overwritten by setHeader', t => {
  const response = new Response()
    .appendHeader('x-test', 'a')
    .setHeader('x-test', 'b')
  t.same(response.getHeader('x-test'), 'b')
})
