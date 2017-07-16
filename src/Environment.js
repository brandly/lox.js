const RuntimeError = require('./RuntimeError')

module.exports = class Environment {
  constructor () {
    this.values = {}
  }

  define (name, value) {
    this.values[name] = value
  }

  get (name) {
    if (this.values.hasOwnProperty(name.lexeme)) {
      return this.values[name.lexeme]
    }

    throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.")
  }

  assign (name, value) {
    if (this.values.hasOwnProperty(name.lexeme)) {
      this.values.put(name.lexeme, value)
      return
    }

    throw new RuntimeError(name,
        "Undefined variable '" + name.lexeme + "'.")
  }
}
