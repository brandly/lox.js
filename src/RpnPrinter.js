class RpnPrinter {
  print (expr) {
    return expr.accept(this)
  }

  visitBinaryExpr (expr) {
    return this._polishize(expr.operator.lexeme, expr.left, expr.right)
  }

  visitGroupingExpr (expr) {
    return this._polishize('group', expr.expression)
  }

  visitLiteralExpr (expr) {
    return expr.value.toString()
  }

  visitUnaryExpr (expr) {
    return this._polishize(expr.operator.lexeme, expr.right)
  }

  _polishize (name) {
    const exprs = Array.prototype.slice.call(arguments, 1)
    var str = ''

    exprs.forEach(expr => {
      str += `${expr.accept(this)} `
    })

    str += name

    return str
  }
}

module.exports = RpnPrinter
