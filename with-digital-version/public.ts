export interface Token{
  kind:TokenKind;  
  text:string;
}

//Token的类型
export enum TokenKind {Keyword, Identifier, StringLiteral, IntegerLiteral, DecimalLiteral, NullLiteral, BooleanLiteral, Seperator, Operator, EOF};


export class CharStream {
  pos = 0
  line = 1
  col = 0
  constructor(public data:string) {}
  peek() { return this.data.charAt(this.pos) }
  isEof() { return this.peek() === '' }
  next() {
    const ch = this.data.charAt(this.pos++)
    if (ch === '\n') {
      this.line++
      this.col = 0
    } else this.col++
    return ch
  }
}