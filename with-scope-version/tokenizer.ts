import {
  TokenKind, Token, CharStream
} from './public'

export class Tokenizer {
  static KEYWORDS = [
  "function", "class",     "break",       "delete",    "return",    
  "case",      "do",        "if",          "switch",    "var",
  "catch",     "else",      "in",          "this",      "void",
  "continue",  "false",     "instanceof",  "throw",     "while",
  "debugger",  "finally",   "new",         "true",      "with",  
  "default",   "for",       "null",        "try",       "typeof",
  //下面这些用于严格模式
  "implements","let",       "private",     "public",    "yield", 
  "interface", "package",   "protected",   "static" ]
  tokens:Token[] = []
  constructor(public code: CharStream) {}
  next() {
    return this.tokens.shift() || this.getNextToken()
    // if (!this.tokens.length) this.tokens.push(this.getNextToken())
    // return this.tokens.shift()!
  }
  peek() {
    if (!this.tokens.length) {
      this.tokens.push(this.getNextToken())
    }
    return this.tokens[0]
  }
  peekNext() {
    while (this.tokens.length < 2) {
      this.tokens.push(this.getNextToken())
    }
    return this.tokens[1]
  }
  getNextToken():Token {
    this.skipWhiteSpaces()
    if (this.code.isEof()) return { kind: TokenKind.EOF, text: '' }
    else {
      let { peek, next, isEof } = this.code
      peek = peek.bind(this.code)
      next = next.bind(this.code)
      isEof = isEof.bind(this.code)
      const c = peek()
      switch (c) {
        case '"': return this.parseStringLiteral()
        case '.': {
          // 可能是小数字面量、指定属性的分隔符、rest操作符
          next()
          let c1 = peek()
          if (this.isDigit(c1)) {
            let literal = '.'
            while (!isEof() && this.isDigit(c1)) {
              literal += next()
              c1 = peek()
            }
            return { kind: TokenKind.DecimalLiteral, text: literal }
          } else if (c1 === '.') {
            next()
            if (peek() === '.') return { kind: TokenKind.Seperator, text: '...' }
            else {
              console.warn('Unrecognized pattern : .., missed a . ?');
              return this.getNextToken();
            }
          } else return { kind: TokenKind.Seperator, text: '.' }
        }
        case '/': {
          next()
          const c1 = peek()
          switch (c1) {
            case '*': {
              this.skitMultiLineComments()
              return this.getNextToken()
            }
            case '/': {
              this.skipSingleLineComments()
              return this.getNextToken()
            }
            case '=': {
              next()
              return { kind: TokenKind.Operator, text: '/=' }
            }
            default: {
              return { kind: TokenKind.Operator, text: '/' }
            }
          }
        }
        case '+': {
          next()
          const c1 = peek()
          if (c1 === '=') {
            next()
            return { kind: TokenKind.Operator, text: '+=' }
          } else if (c1 === '+') {
            next()
            return { kind: TokenKind.Operator, text: '++' }
          } else return { kind: TokenKind.Operator, text: '+' }
        }
        case '-': {
          next()
          const c1 = peek()
          if (c1 === '=') {
            next()
            return { kind: TokenKind.Operator, text: '-=' }
          } else if (c1 === '-') {
            next()
            return { kind: TokenKind.Operator, text: '--' }
          } else return { kind: TokenKind.Operator, text: '-' }
        }
        case '*': {
          next()
          if (peek() === '=') {
            next()
            return { kind: TokenKind.Operator, text: '*=' }
          } else return { kind: TokenKind.Operator, text: '*' }
        }
        case '%': {
          next()
          if (peek() === '=') {
            next()
            return { kind: TokenKind.Operator, text: '%=' }
          } else return { kind: TokenKind.Operator, text: '%' }
        }
        case '>': {
          next()
          const c = peek()
          switch (c) {
            case '=': {
              next()
              return {kind: TokenKind.Operator, text: '>='}
            }
            case '>': {
              next()
              const c = peek()
              if (c === '>') {
                return {kind: TokenKind.Operator, text: '>>>'}
              } else {
                return {kind: TokenKind.Operator, text: '>>'}
              }
            }
            default: return {kind: TokenKind.Operator, text: '>'}
          }
        }
        case '<': {
          next()
          const c = peek()
          switch (c) {
            case '=': {
              next()
              return {kind: TokenKind.Operator, text: '<='}
            }
            case '<': {
              next()
              const c = peek()
              if (c === '<') {
                return {kind: TokenKind.Operator, text: '<'}
              } else {
                return {kind: TokenKind.Operator, text: '<'}
              }
            }
            default: return {kind: TokenKind.Operator, text: '<'}
          }
        }
        case '=': {
          next()
          switch (peek()) {
            case '=': {
              next()
              if (peek()==='=') {
                next()
                return {kind:TokenKind.Seperator,text:'==='}
              } else return {kind:TokenKind.Seperator,text: '=='}
            }
            case '>': {
              next()
              return {kind:TokenKind.Operator,text:'=>'}
            }
            default: return {kind:TokenKind.Operator,text:'='}
          }
        }
        case '!': {
          next()
          if (peek()==='=') {
            next()
            if (peek()==='=') {
              next
              return {kind:TokenKind.Operator,text:'!=='}
            } else return {kind:TokenKind.Operator,text:'!='}
          } else return {kind:TokenKind.Operator,text:'!'}
        }
        case '|': {
          next()
          switch (peek()) {
            case '|': return {kind:TokenKind.Operator,text:'||'}
            case '=': return {kind:TokenKind.Operator,text:'|='}
            default: return {kind:TokenKind.Operator,text:'|'}
          }
        }
        case '&': {
          next()
          switch (peek()) {
            case '&': return {kind:TokenKind.Operator,text:'&&'}
            case '=': return {kind:TokenKind.Operator,text:'&='}
            default: return {kind:TokenKind.Operator,text:'&'}
          }
        }
        case '^': {
          next()
          switch (peek()) {
            case '^': return {kind:TokenKind.Operator,text:'^'}
            case '=': return {kind:TokenKind.Operator,text:'^='}
            default: return {kind:TokenKind.Operator,text:'^'}
          }
        }
        case '~': {
          return {kind:TokenKind.Operator,text:next()}
        }
        
        default: {
          if (this.isLetter(c) || c === '_') return this.parseIdentifier()
          else if (this.isSeperator(c)) {
            next()
            return {kind:TokenKind.Seperator,text:c}
          }
          else if (this.isDigit(c)) {
            // DecimalLiteral: IntegerLiteral '.' [0-9]* 
            //   | '.' [0-9]+
            //   | IntegerLiteral 
            //   ;
            // IntegerLiteral: '0' | [1-9] [0-9]* ;
            const token = { kind: TokenKind.DecimalLiteral, text: next() }
            while (!isEof() && this.isDigit(peek())) token.text += next()
            if (peek() === '.') {
              token.text += next()
              while (!isEof() && this.isDigit(peek())) token.text += next()
              return token
            } else {
              token.kind = TokenKind.IntegerLiteral
              return token
            }
          } else {
            //暂时去掉不能识别的字符
            console.log(`Unrecognized pattern meeting: '${c}', at ${this.code.line} col: ${this.code.col}`);
            this.code.next();
            return this.getNextToken()
          }
        }
      }
    }
  }
  parseIdentifier() {
    let literal = this.code.next()
    while (!this.code.isEof() && (
      this.isLetterOrUnderscore(this.code.peek()) || this.isDigit(this.code.peek())
    )) literal += this.code.next()
    // 查询是否为关键字
    if (Tokenizer.KEYWORDS.includes(literal)) return { kind:TokenKind.Keyword, text: literal }
    else if (literal === 'null') return { kind: TokenKind.NullLiteral, text: literal }
    else if (['false', 'true'].includes(literal)) return { kind: TokenKind.BooleanLiteral, text: literal }
    return { kind: TokenKind.Identifier, text: literal }
  }
  parseStringLiteral() {
    this.code.next()
    const token = { kind: TokenKind.StringLiteral, text: '' }
    while (
      !this.code.isEof() &&
      this.code.peek() !== '"'
    ) token.text += this.code.next()
    if (this.code.peek() === '"')  this.code.next()
    return token
  }
  skipWhiteSpaces() { while (this.isWhiteSpace(this.code.peek())) this.code.next() }
  isWhiteSpace(ch:string) { return ch === ' '||ch ==='\n'||ch==='\t' }
  isLetter(ch:string) { return ch>='A'&&ch<='Z' || ch>='a'&&ch<='z' }
  isDigit(ch:string) { return ch>='0'&&ch<='9' }
  isLetterOrUnderscore(ch:string) { return this.isLetter(ch)||this.isDigit(ch)||ch==='_' }
  isSeperator(ch:string) { return ['(',')','[',']','{','}',';',',',':','?','@'].includes(ch) }
  skitMultiLineComments() {
    this.code.next()
    if (!this.code.isEof()) {
      let c1 = this.code.next()
      while (!this.code.isEof()) {
        let c2 = this.code.next()
        if (c1 === '*'&& c2 === '/') return
        else c1 = c2
      }
    }
  }
  skipSingleLineComments() {
    this.code.next()
    while (
      !this.code.isEof() &&
      this.code.peek() !== '/'
    ) this.code.next()
  }
}