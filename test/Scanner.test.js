/* global describe, it */
const fs = require('fs')
const assert = require('assert')
const Scanner = require('../src/Scanner')

describe('Scanner', () => {
  it('produces tokens for basic arithmetic', () => {
    const source = fs.readFileSync('./examples/simple.lox', 'utf-8')

    const tokens = new Scanner(source).scanTokens()
    assert.deepEqual(
      tokens.map(t => t.type),
      [
        'PRINT',
        'LEFT_PAREN',
        'NUMBER',
        'PLUS',
        'NUMBER',
        'RIGHT_PAREN',
        'STAR',
        'LEFT_PAREN',
        'NUMBER',
        'MINUS',
        'NUMBER',
        'RIGHT_PAREN',
        'SEMICOLON',
        'EOF'
      ]
    )
  })
})
