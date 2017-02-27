const fs = require('fs')
const Scanner = require('./Scanner')
const filename = process.argv[2]

const sourceCode = fs.readFileSync(filename).toString()
const scanner = new Scanner(sourceCode)
const tokens = scanner.scanTokens()

tokens
  .map(token => token.toString())
  .forEach(str => console.log(str))
