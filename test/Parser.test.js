/* global describe, it */
const fs = require('fs')
const assert = require('assert')
const Scanner = require('../src/Scanner')
const Parser = require('../src/Parser')

// Some functions that'll help us assert the expected tree structure
const noop = () => {}
const Expression = (left = noop, op = noop, right = noop) => {
  return (obj) => {
    assert.ok(typeof obj === 'object', 'Expression not an object')
    assert.ok(typeof obj.expression === 'object', 'Expression.expression not an object')

    const expr = obj.expression
    assert.ok(typeof expr.left === 'object', 'Left not an object' + expr.left)
    assert.ok(typeof expr.operator === 'object', 'Operator not an object')
    assert.ok(typeof expr.right === 'object', 'Right not an object')

    left(expr.left)
    op(expr.op)
    right(expr.right)
  }
}
const Value = (val) => (obj) => {
  assert.ok(typeof obj === 'object', 'Value not an object')
  assert.ok(obj.value === val, 'Actual value doesnt match')
}

describe('Parser', () => {
  it('parses basic arithmetic', () => {
    const source = fs.readFileSync('./examples/simple.lox', 'utf-8')

    const tokens = new Scanner(source).scanTokens()
    const ast = new Parser(tokens).parse()

    Expression(
      Expression(
        Value(1),
        noop,
        Value(2)
      ),
      noop,
      Expression(
        Value(4),
        noop,
        Value(3)
      )
    )(ast[0])
  })
})
