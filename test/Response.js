
// 3rd
import test from 'ava'
// 1st
import { Response } from '../lib'

test('Response#appendHeader with string val', t => {
  const response = new Response()
    .appendHeader('x-test', 'val')
  t.same(response.getHeader('x-test').toJS(), ['val'])
})

test('Response#appendHeader with string val with existing string header', t => {
  const response = new Response()
    .setHeader('x-test', 'existing')
    .appendHeader('x-test', 'val')
  t.same(response.getHeader('x-test').toJS(), ['existing', 'val'])
})

test('Response#appendHeader with array val', t => {
  const response = new Response()
    .appendHeader('x-test', ['val1', 'val2'])
  t.same(response.getHeader('x-test').toJS(), ['val1', 'val2'])
})

test('Response#appendHeader with array vals with existing array header', t => {
  const response = new Response()
    .setHeader('x-test', ['a', 'b'])
    .appendHeader('x-test', ['c', 'd'])
  t.same(response.getHeader('x-test').toJS(), ['a', 'b', 'c', 'd'])
})

test('Response#appendHeader does not merge nil vals', t => {
  const response = new Response()
    .appendHeader('x-test', ['a', null, 'b', undefined])
  t.same(response.getHeader('x-test').toJS(), ['a', 'b'])
})
