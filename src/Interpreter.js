const TT = require('./TokenType')
const Environment = require('./Environment')
const RuntimeError = require('./RuntimeError')

class Interpreter {
  constructor () {
    this.environment = new Environment()
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

  visitPrintStmt (stmt) {
    const value = this._evaluate(stmt.expression)
    console.log(value)
  }

  visitLiteralExpr (expr) {
    return expr.value
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
        return !this._isTrue(right)
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

  visitVarStmt (stmt) {
    var value = null
    if (stmt.initializer !== null) {
      value = this._evaluate(stmt.initializer)
    }

    this.environment.define(stmt.name.lexeme, value)
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

  _isTrue (obj) {
    if (obj == null) return false
    if (obj instanceof Boolean) return obj
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

module.exports = Interpreter
