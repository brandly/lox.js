const TT = require('./TokenType')
const Expr = require('./Expr')
const Stmt = require('./Stmt')

class Parser {
  constructor (tokens, Lox) {
    this.tokens = tokens
    this.current = 0
    this.Lox = Lox
  }

  parse () {
    const statements = []

    while (!this._isAtEnd()) {
      statements.push(this._declaration())
    }

    return statements
  }

  _declaration () {
    try {
      if (this._match(TT.VAR)) {
        return this._varDeclaration()
      } else {
        return this._statement()
      }
    } catch (error) {
      this._synchronize()
      return null
    }
  }

  _varDeclaration () {
    const name = this._consume(TT.IDENTIFIER, 'Expect variable name.')

    let initializer = null
    if (this._match(TT.EQUAL)) {
      initializer = this._expression()
    }

    this._consume(TT.SEMICOLON, "Expect ';' after variable declaration.")
    return new Stmt.Var(name, initializer)
  }

  _statement () {
    if (this._match(TT.FOR)) {
      return this._forStatement()
    } else if (this._match(TT.IF)) {
      return this._ifStatement()
    } else if (this._match(TT.PRINT)) {
      return this._printStatement()
    } else if (this._match(TT.WHILE)) {
      return this._whileStatement()
    } else if (this._match(TT.LEFT_BRACE)) {
      return new Stmt.Block(this._block())
    } else {
      return this._expressionStatement()
    }
  }

  _forStatement () {
    this._consume(TT.LEFT_PAREN, "Expect '(' after 'for'.")

    var initializer
    if (this._match(TT.SEMICOLON)) {
      initializer = null
    } else if (this._match(TT.VAR)) {
      initializer = this._varDeclaration()
    } else {
      initializer = this._expressionStatement()
    }

    var condition = null
    if (!this._check(TT.SEMICOLON)) {
      condition = this._expression()
    }

    this._consume(TT.SEMICOLON, "Expect ';' after loop condition.")

    var increment = null
    if (!this._check(TT.RIGHT_PAREN)) {
      increment = this._expression()
    }
    this._consume(TT.RIGHT_PAREN, "Expect ')' after for clauses.")

    var body = this._statement()

    // Begin desugaring into a `while` loop...
    if (increment !== null) {
      body = new Stmt.Block([body, new Stmt.Expression(increment)])
    }

    if (condition === null) {
      condition = new Expr.Literal(true)
    }
    body = new Stmt.While(condition, body)

    if (initializer !== null) {
      body = new Stmt.Block([initializer, body])
    }

    return body
  }

  _whileStatement () {
    this._consume(TT.LEFT_PAREN, "Expect '(' after 'while'.")
    const condition = this._expression()
    this._consume(TT.RIGHT_PAREN, "Expect ')' after 'condition'.")
    const body = this._statement()

    return new Stmt.While(condition, body)
  }

  _ifStatement () {
    this._consume(TT.LEFT_PAREN, "Expect '(' after 'if'.")
    const condition = this._expression()
    this._consume(TT.RIGHT_PAREN, "Expect ')' after 'if'.")

    const thenBranch = this._statement()
    var elseBranch = null
    if (this._match(TT.ELSE)) {
      elseBranch = this._statement()
    }

    return new Stmt.If(condition, thenBranch, elseBranch)
  }

  _printStatement () {
    const value = this._expression()
    this._consume(TT.SEMICOLON, "Expect ';' after value.")
    return new Stmt.Print(value)
  }

  _block () {
    const statements = []

    while (!this._check(TT.RIGHT_BRACE) && !this._isAtEnd()) {
      statements.push(this._declaration())
    }

    this._consume(TT.RIGHT_BRACE, "Expect '}' after block.")
    return statements
  }

  _expressionStatement () {
    const expr = this._expression()
    this._consume(TT.SEMICOLON, "Expect ';' after value.")
    return new Stmt.Expression(expr)
  }

  _expression () {
    return this._assignment()
  }

  _assignment () {
    const expr = this._or()

    if (this._match(TT.EQUAL)) {
      const equals = this._previous()
      const value = this._assignment()

      if (expr instanceof Expr.Variable) {
        const name = expr.name
        return new Expr.Assign(name, value)
      }

      this._error(equals, 'Invalid assignment target.')
    }

    return expr
  }

  _or () {
    var expr = this._and()

    while (this._match(TT.OR)) {
      const operator = this._previous()
      const right = this._and()
      expr = new Expr.Logical(expr, operator, right)
    }

    return expr
  }

  _and () {
    var expr = this._equality()

    while (this._match(TT.AND)) {
      const operator = this._previous()
      const right = this._equality()
      expr = new Expr.Logical(expr, operator, right)
    }

    return expr
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

    if (this._match(TT.IDENTIFIER)) {
      return new Expr.Variable(this._previous())
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
    this.Lox.parseError(token, message)
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
