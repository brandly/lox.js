/* generated by generateAst.js */

class Stmt {
  accept (visitor) {}
}

class Expression extends Stmt {
  constructor (expression) {
    super()
    this.expression = expression
  }

  accept (visitor) {
    return visitor.visitExpressionStmt(this)
  }
}

class Print extends Stmt {
  constructor (expression) {
    super()
    this.expression = expression
  }

  accept (visitor) {
    return visitor.visitPrintStmt(this)
  }
}

class Var extends Stmt {
  constructor (name, initializer) {
    super()
    this.name = name
    this.initializer = initializer
  }

  accept (visitor) {
    return visitor.visitVarStmt(this)
  }
}

module.exports = {
  Expression,
  Print,
  Var
}
