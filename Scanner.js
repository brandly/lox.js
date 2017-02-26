const TT = require('./TokenType')

const reservedWords = {
  and: TT.AND,
  class: TT.CLASS,
  else: TT.ELSE,
  false: TT.FALSE,
  for: TT.FOR,
  fun: TT.FUN,
  if: TT.IF,
  nil: TT.NIL,
  or: TT.OR,
  print: TT.PRINT,
  return: TT.RETURN,
  super: TT.SUPER,
  this: TT.THIS,
  true: TT.TRUE,
  var: TT.VAR,
  while: TT.WHILE
}

class Token {
  constructor (type, lexeme, literal, line) {
    this.type = type
    this.lexeme = lexeme
    this.literal = literal
    this.line = line
  }

  toString () {
    return `${this.type} ${this.lexeme} ${this.literal}`
  }
}

class Scanner {
  constructor (source) {
    this.source = source
    this.tokens = []

    this.start = 0
    this.current = 0
    this.line = 1
  }

  scanTokens () {
    while (!this._isAtEnd()) {
      this.start = this.current
      this._scanToken()
    }

    this.tokens.push(new Token(TT.EOF, '', null, this.line))
    return this.tokens
  }

  _isAtEnd () {
    return this.current >= this.source.length
  }

  _scanToken () {
    const char = this._advance()

    switch (char) {
      case '(':
        this._addToken(TT.LEFT_PAREN)
        break
      case ')':
        this._addToken(TT.RIGHT_PAREN)
        break
      case '{':
        this._addToken(TT.LEFT_BRACE)
        break
      case '}':
        this._addToken(TT.RIGHT_BRACE)
        break
      case ',':
        this._addToken(TT.COMMA)
        break
      case '.':
        this._addToken(TT.DOT)
        break
      case '-':
        this._addToken(TT.MINUS)
        break
      case '+':
        this._addToken(TT.PLUS)
        break
      case ';':
        this._addToken(TT.SEMICOLON)
        break
      case '*':
        this._addToken(TT.STAR)
        break
      case '!':
        this._addToken(this._match('=') ? TT.BANG_EQUAL : TT.BANG)
        break
      case '=':
        this._addToken(this._match('=') ? TT.EQUAL_EQUAL : TT.EQUAL)
        break
      case '<':
        this._addToken(this._match('=') ? TT.LESS_EQUAL : TT.LESS)
        break
      case '>':
        this._addToken(this._match('=') ? TT.GREATER_EQUAL : TT.GREATER)
        break
      case '/':
        if (this._match('/')) {
          // A comment goes until the end of the line.
          while (this._peek() !== '\n' && !this._isAtEnd()) {
            this._advance()
          }
        } else {
          this._addToken(TT.SLASH)
        }
        break
      case ' ':
      case '\r':
      case '\t':
        // Ignore whitespace.
        break
      case '\n':
        this.line += 1
        break
      case '"':
        this._scanString()
        break
      default:
        if (this._isDigit(char)) {
          this._scanNumber()
        } else if (this._isAlpha(char)) {
          this._scanIdentifier()
        } else {
          throw new Error(`Unexpected character on line ${this.line}.`)
        }
        break
    }
  }

  _advance () {
    const char = this.source[this.current]
    this.current += 1
    return char
  }

  _addToken (type, literal = null) {
    const text = this.source.substring(this.start, this.current)
    this.tokens.push(new Token(type, text, literal, this.line))
  }

  _match (expectedChar) {
    if (this._isAtEnd()) {
      return false
    }

    if (this.source[this.current] !== expectedChar) {
      return false
    }

    this.current += 1
    return true
  }

  _peek () {
    if (this._isAtEnd()) {
      return '\0'
    }

    return this.source[this.current]
  }

  _scanString () {
    while (this._peek() !== '"' && !this._isAtEnd()) {
      if (this._peek() === '\n') {
        this.line++
      }

      this._advance()
    }

    // Unterminated string.
    if (this._isAtEnd()) {
      throw new Error(`Unterminated string on line ${this.line}`)
    }

    // The closing ".
    this._advance()

    // Trim the surrounding quotes.
    const value = this.source.substring(this.start + 1, this.current - 1)
    this._addToken(TT.STRING, value)
  }

  _isDigit (char) {
    return char >= '0' && char <= '9'
  }

  _scanNumber () {
    while (this._isDigit(this._peek())) {
      this._advance()
    }

    // Look for a fractional part.
    if (this._peek() === '.' && this._isDigit(this._peekNext())) {
      // Consume the "."
      this._advance()

      while (this._isDigit(this._peek())) {
        this._advance()
      }
    }

    this._addToken(TT.NUMBER, parseFloat(this.source.substring(this.start, this.current)))
  }

  _peekNext () {
    if (this.current + 1 >= this.source.length) {
      return '\0'
    }
    return this.source[this.current + 1]
  }

  _scanIdentifier () {
    while (this._isAlphaNumeric(this._peek())) {
      this._advance()
    }

    const text = this.source.substring(this.start, this.current)

    const type = text in reservedWords ? reservedWords[text] : TT.IDENTIFIER
    this._addToken(type)
  }

  _isAlpha (char) {
    return (char >= 'a' && char <= 'z') ||
           (char >= 'A' && char <= 'Z') ||
            char === '_'
  }

  _isAlphaNumeric (char) {
    return this._isAlpha(char) || this._isDigit(char)
  }
}

module.exports = Scanner
