const Lox = require('./Lox')
const filename = process.argv[2]

if (!filename) {
  console.log('Usage: node index.js [script]')
}

Lox.runFile(filename)
