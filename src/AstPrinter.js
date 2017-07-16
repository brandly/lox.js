class AstPrinter {
  /* prints out AST in a lisp-y way */
  print (expr) {
    return expr.accept(this)
  }

  visitBinaryExpr (expr) {
    return this._parenthesize(expr.operator.lexeme, expr.left, expr.right)
  }

  visitGroupingExpr (expr) {
    return this._parenthesize('group', expr.expression)
  }

  visitLiteralExpr (expr) {
    return expr.value.toString()
  }

  visitUnaryExpr (expr) {
    return this._parenthesize(expr.operator.lexeme, expr.right)
  }

  _parenthesize (name) {
    const exprs = Array.prototype.slice.call(arguments, 1)
    var str = `(${name}`

    exprs.forEach(expr => {
      str += ` ${expr.accept(this)}`
    })

    str += ')'

    return str
  }
}

module.exports = AstPrinter
