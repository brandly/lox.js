const TT = require('./TokenType')
const Environment = require('./Environment')
const RuntimeError = require('./RuntimeError')

class Interpreter {
  constructor () {
    this._globals = new Environment()
    this.environment = this._globals

    this._globals.define('clock', new NativeFn(0, () => {
      return Date.now() / 1000
    }))
  }

  interpret (statements, Lox) {
    try {
      statements.forEach(stmt => {
        this._execute(stmt)
      })
    } catch (error) {
      Lox.runtimeError(error)
    }
  }

  visitExpressionStmt (stmt) {
    this._evaluate(stmt.expression)
  }

  visitFunctionStmt (stmt) {
    const fn = new LoxFn(stmt)
    this.environment.define(stmt.name.lexeme, fn)
    return null
  }

  visitIfStmt (stmt) {
    if (this._isTruthy(this._evaluate(stmt.condition))) {
      this._execute(stmt.thenBranch)
    } else if (stmt.elseBranch !== null) {
      this._execute(stmt.elseBranch)
    }
    return null
  }

  visitPrintStmt (stmt) {
    const value = this._evaluate(stmt.expression)
    console.log(value.toString())
  }

  visitReturnStmt (stmt) {
    var value = null
    if (stmt.value !== null) {
      value = this._evaluate(stmt.value)
    }

    throw new Return(value)
  }

  visitLiteralExpr (expr) {
    return expr.value
  }

  visitLogicalExpr (expr) {
    const left = this._evaluate(expr.left)

    if (expr.operator.type === TT.OR) {
      if (this._isTruthy(left)) return left
    } else {
      if (!this._isTruthy(left)) return left
    }

    return this._evaluate(expr.right)
  }

  visitGroupingExpr (expr) {
    return this._evaluate(expr.expression)
  }

  visitUnaryExpr (expr) {
    // operator, right
    const right = this._evaluate(expr.right)

    switch (expr.operator.type) {
      case TT.MINUS:
        this._checkNumberOperand(expr.operator, right)
        return -Number(right)
      case TT.BANG:
        this._checkNumberOperand(expr.operator, right)
        return !this._isTruthy(right)
    }
  }

  visitBinaryExpr (expr) {
    const right = this._evaluate(expr.right)
    const left = this._evaluate(expr.left)

    switch (expr.operator.type) {
      case TT.MINUS:
        this._checkNumberOperands(expr.operator, left, right)
        return Number(left) - Number(right)
      case TT.PLUS:
        if (typeof left === 'number' || typeof right === 'number') {
          // TODO: i should probably worry about NaNs
          return Number(left) + Number(right)
        }

        if (typeof left === 'string' && typeof right === 'string') {
          return left + right
        }

        throw new RuntimeError(expr.operator, 'Operands must be two numbers or two strings.')
      case TT.SLASH:
        this._checkNumberOperands(expr.operator, left, right)

        if (Number(right) === 0) {
          throw new RuntimeError(expr.operator, 'Unable to divide by zero.')
        }

        return Number(left) / Number(right)
      case TT.STAR:
        this._checkNumberOperands(expr.operator, left, right)
        return Number(left) * Number(right)
      case TT.GREATER:
        this._checkNumberOperands(expr.operator, left, right)
        return Number(left) > Number(right)
      case TT.GREATER_EQUAL:
        this._checkNumberOperands(expr.operator, left, right)
        return Number(left) >= Number(right)
      case TT.LESS:
        this._checkNumberOperands(expr.operator, left, right)
        return Number(left) < Number(right)
      case TT.LESS_EQUAL:
        this._checkNumberOperands(expr.operator, left, right)
        return Number(left) <= Number(right)
      case TT.BANG_EQUAL:
        this._checkNumberOperands(expr.operator, left, right)
        return !this._isEqual(left, right)
      case TT.EQUAL_EQUAL:
        this._checkNumberOperands(expr.operator, left, right)
        return this._isEqual(left, right)
    }

    // Unreachable.
    return null
  }

  visitCallExpr (expr) {
    const callee = this._evaluate(expr.callee)
    const args = expr.args.map(arg => this._evaluate(arg))

    if (!(callee instanceof LoxCallable)) {
      throw new RuntimeError(expr.paren,
        'Can only call functions and classes.')
    }

    // TODO: what's the equivalent of:
    // LoxCallable function = (LoxCallable)callee;

    if (args.length !== callee.arity()) {
      throw new RuntimeError(expr.paren,
        `Expected ${callee.arity()} arguments but got ${args.length}.`)
    }
    return callee.call(this, args)
  }

  visitVarStmt (stmt) {
    var value = null
    if (stmt.initializer !== null) {
      value = this._evaluate(stmt.initializer)
    }

    this.environment.define(stmt.name.lexeme, value)
    return null
  }

  visitWhileStmt (stmt) {
    while (this._isTruthy(this._evaluate(stmt.condition))) {
      this._execute(stmt.body)
    }
    return null
  }

  visitVariableExpr (expr) {
    return this.environment.get(expr.name)
  }

  visitAssignExpr (expr) {
    const value = this._evaluate(expr.value)

    this.environment.assign(expr.name, value)
    return value
  }

  _execute (stmt) {
    stmt.accept(this)
  }

  visitBlockStmt (stmt) {
    this._executeBlock(stmt.statements, new Environment(this.environment))
    return null
  }

  _executeBlock (statements, environment) {
    const previous = this.environment
    try {
      this.environment = environment
      statements.forEach(statement => {
        this._execute(statement)
      })
    } finally { // TODO
      this.environment = previous
    }
  }

  _evaluate (expr) {
    return expr.accept(this)
  }

  _isTruthy (obj) {
    if (obj === null) return false
    if (typeof obj === 'boolean') return obj
    return true
  }

  _isEqual (a, b) {
    return a === b
  }

  _checkNumberOperand (operator, operand) {
    if (typeof operand === 'number') return
    throw new RuntimeError(operator, 'Operand must be a number.')
  }

  _checkNumberOperands (operator, left, right) {
    if (typeof left === 'number' && typeof right === 'number') return
    throw new RuntimeError(operator, 'Operands must be a numbers.')
  }
}

class LoxCallable {
  arity () { return this._arity }
  // call (interpreter, args) {}
}

class NativeFn extends LoxCallable {
  constructor (arity, fn) {
    super(arity, fn)
    this._arity = arity
    this._fn = fn
  }

  call (interpreter, args) {
    return this._fn.apply(null, args)
  }
}

class LoxFn extends LoxCallable {
  constructor (declaration) {
    super()
    this._declaration = declaration
  }

  arity () {
    return this._declaration.parameters.length
  }

  toString () {
    return `<fn ${this._declaration.name.lexeme}>`
  }

  call (interpreter, args) {
    const environment = new Environment(interpreter.environment)

    this._declaration.parameters.forEach((param, index) => {
      environment.define(param.lexeme, args[index])
    })

    try {
      interpreter._executeBlock(this._declaration.body, environment)
    } catch (err) {
      if (err instanceof Return) {
        return err.value
      } else {
        throw err
      }
    }
    return null
  }
}

class Return extends RuntimeError {
  constructor (value) {
    super(value)
    this.value = value
  }
}

module.exports = Interpreter
