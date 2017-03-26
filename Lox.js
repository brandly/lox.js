const fs = require('fs')
const Scanner = require('./Scanner')
const Parser = require('./Parser')
const AstPrinter = require('./AstPrinter')
const TT = require('./TokenType')

// Closest thing to a static var without ES7
var hadError = false

class Lox {
  static runFile (filename) {
    const source = fs.readFileSync(filename).toString()
    this._run(source)

    if (hadError) process.exit(1)
  }

  // TODO:
  // http://www.craftinginterpreters.com/scanning.html#the-interpreter-framework
  static runPrompt () {
    // InputStreamReader input = new InputStreamReader(System.in);
    // BufferedReader reader = new BufferedReader(input);

    // for (;;) {
    //   System.out.print("> ");
    //   run(reader.readLine());
    //   hadError = false
    // }
  }

  static error (line, message) {
    this._report(line, '', message)
  }

  static parseError (token, message) {
    if (token.type === TT.EOF) {
      this._report(token.line, ' at end', message)
    } else {
      this._report(token.line, ` at '${token.lexeme}'`, message)
    }
  }

  static _report (line, where, message) {
    console.error(`[line ${line}] Error${where}: ${message}`)
    hadError = true
  }

  static _run (source) {
    const scanner = new Scanner(source)
    const tokens = scanner.scanTokens()

    // For now, just print the tokens.
    // tokens.forEach(token => {
    //   console.log(token)
    // })

    const parser = new Parser(tokens)
    const expression = parser.parse()

    if (hadError) {
      console.error('Unable to run')
    } else {
      console.log(new AstPrinter().print(expression))
    }
  }
}

module.exports = Lox
