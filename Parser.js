const TT = require('./TokenType')
const Expr = require('./Expr')
const Lox = require('./Lox')

class Parser {
  constructor (tokens) {
    this.tokens = tokens
    this.current = 0
  }

  parse () {
    try {
      return this._expression()
    } catch (error) {
      if (error instanceof ParseError) {
        return null
      }
      throw error
    }
  }

  _expression () {
    return this._equality()
  }

  _equality () {
    var expr = this._comparison()

    while (this._match(TT.BANG_EQUAL, TT.EQUAL_EQUAL)) {
      const operator = this._previous()
      const right = this._comparison()
      expr = new Expr.Binary(expr, operator, right)
    }

    return expr
  }

  _comparison () {
    var expr = this._term()

    while (this._match(TT.GREATER, TT.GREATER_EQUAL, TT.LESS, TT.LESS_EQUAL)) {
      const operator = this._previous()
      const right = this._term()
      expr = new Expr.Binary(expr, operator, right)
    }

    return expr
  }

  _term () {
    var expr = this._factor()

    while (this._match(TT.MINUS, TT.PLUS)) {
      const operator = this._previous()
      const right = this._factor()
      expr = new Expr.Binary(expr, operator, right)
    }

    return expr
  }

  _factor () {
    var expr = this._unary()

    while (this._match(TT.SLASH, TT.STAR)) {
      const operator = this._previous()
      const right = this._unary()
      expr = new Expr.Binary(expr, operator, right)
    }

    return expr
  }

  _unary () {
    if (this._match(TT.BANG, TT.MINUS)) {
      const operator = this._previous()
      const right = this._unary()
      return new Expr.Unary(operator, right)
    }

    return this._primary()
  }

  _primary () {
    if (this._match(TT.FALSE)) return new Expr.Literal(false)
    if (this._match(TT.TRUE)) return new Expr.Literal(true)
    if (this._match(TT.NIL)) return new Expr.Literal(null)

    if (this._match(TT.NUMBER, TT.STRING)) {
      return new Expr.Literal(this._previous().literal)
    }

    if (this._match(TT.LEFT_PAREN)) {
      const expr = this._expression()
      this._consume(TT.RIGHT_PAREN, "Expect ')' after expression.")
      return new Expr.Grouping(expr)
    }

    throw this._error(this._peek(), 'Expect expression.')
  }

  _match () {
    const types = Array.prototype.slice.call(arguments)

    for (var index in types) {
      const type = types[index]
      if (this._check(type)) {
        this._advance()
        return true
      }
    }

    return false
  }

  _check (type) {
    if (this._isAtEnd()) {
      return false
    }
    return this._peek().type === type
  }

  _advance () {
    if (!this._isAtEnd()) this.current++
    return this._previous()
  }

  _isAtEnd () {
    return this._peek().type === TT.EOF
  }

  _peek () {
    return this.tokens[this.current]
  }

  _previous () {
    return this.tokens[this.current - 1]
  }

  _consume (type, message) {
    if (this._check(type)) return this._advance()

    throw this._error(this._peek(), message)
  }

  _error (token, message) {
    Lox.parseError(token, message)
    return new ParseError()
  }

  _synchronize () {
    this._advance()

    while (!this._isAtEnd()) {
      if (this._previous().type === TT.SEMICOLON) return

      switch (this._peek().type) {
        case TT.CLASS:
        case TT.FUN:
        case TT.VAR:
        case TT.FOR:
        case TT.IF:
        case TT.WHILE:
        case TT.PRINT:
        case TT.RETURN:
          return
      }

      this._advance()
    }
  }
}

class ParseError extends Error {
  constructor (message) {
    super()
    Error.captureStackTrace(this, this.constructor)
    this.name = 'ParseError'
    this.message = message
  }
}

module.exports = Parser
