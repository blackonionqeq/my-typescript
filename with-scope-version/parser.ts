import { Tokenizer } from './tokenizer'
import {
  BinaryExpression,
  DecimalLiteral,
  Expression,
  ExpressionStatement,
  IntegerLiteral,
  Prog, Statement, StringLiteral, Variable, VariableDecl, FunctionDecl, FunctionCall, Block,
} from './abstract-syntac-tree'
import { TokenKind } from './public'


export class Parser {
  constructor(public tokenizer: Tokenizer) {}

  parseProg() {
    return new Prog(this.parseStatementList())
  }
  parsePrimary() {
    let { next, peek, peekNext } = this.tokenizer
    next = next.bind(this.tokenizer)
    peek = peek.bind(this.tokenizer)
    peekNext = peekNext.bind(this.tokenizer)
    const token = peek()
    switch (token.kind) {
      case TokenKind.Identifier: {
        if (peekNext().text === '(') return this.parseFunctionCall()
        else {
          next()
          return new Variable(token.text)
        }
      }
      case TokenKind.IntegerLiteral: {
        next()
        return new IntegerLiteral(+token.text)
      }
      case TokenKind.DecimalLiteral: {
        next()
        return new DecimalLiteral(parseFloat(token.text))
      }
      case TokenKind.StringLiteral: {
        next()
        return new StringLiteral(token.text)
      }
      default: {
        if (token.text === '(') {
          next()
          const exp = this.parseExpression()
          if (peek().text === ')') {
            next()
            return exp
          } else {
            console.warn(`Expecting a ')' at the end of a primary expresson, while we got a ${peek().text}`);
            return null;
          }
        } else {
          console.warn(`Can not recognize a primary expression starting with: ${token.text}`);
          return null;
        }
      }
    }
  }
  operationPrecedence = new Map([
    ['=', 2],
    ['+=', 2],
    ['-=', 2],
    ['*=', 2],
    ['-=', 2],
    ['%=', 2],
    ['&=', 2],
    ['|=', 2],
    ['^=', 2],
    ['~=', 2],
    ['<<=', 2],
    ['>>=', 2],
    ['>>>=', 2],
    ['||', 4],
    ['&&', 5],
    ['|', 6],
    ['^', 7],
    ['&', 8],
    ['==', 9],
    ['===', 9],
    ['!=', 9],
    ['!==', 9],
    ['>', 10],
    ['>=', 10],
    ['<', 10],
    ['<=', 10],
    ['<<', 11],
    ['>>', 11],
    ['>>>', 11],
    ['+', 12],
    ['-', 12],
    ['*', 13],
    ['/', 13],
    ['%', 13],
  ]);
  getPrecedence(operator: string) {
    return this.operationPrecedence.get(operator) || -1
    // const res = this.operationPrecedence.get(operator)
    // if (res) return res
    // return -1
    // throw new Error(`未定义优先级的操作符：${operator}`)
  }
  parseBinaryExpression(precedence: number): Expression|null {
    let exp1 = this.parsePrimary()
    if (exp1) {
      let { text, kind } = this.tokenizer.peek()
      let tokenPrecedence = this.getPrecedence(text)
      while (kind === TokenKind.Operator && tokenPrecedence > precedence) {
        this.tokenizer.next()
        // 这里用了递归，如果不用递归，也可以自己用操作符栈和表达式栈来迭代
        const exp2 = this.parseBinaryExpression(tokenPrecedence)
        if (exp2) {
          exp1 = new BinaryExpression(text, exp1, exp2);
          ({ text, kind } = this.tokenizer.peek())
          tokenPrecedence = this.getPrecedence(text)
        } else {
          console.warn(`Can not recognize a expression starting with: ${text}`);
        }
      }
      return exp1
    } else {
      console.warn(`Can not recognize a expression starting with: ${this.tokenizer.peek().text}`);
      return null
    }
  }
  parseExpression() {
    return this.parseBinaryExpression(0)
  }
  parseExpressionStatement() {
    const exp = this.parseExpression()
    if (exp) {
      if (this.tokenizer.peek().text === ';') {
        this.tokenizer.next()
        return new ExpressionStatement(exp)
      } else {
        console.warn(`Expecting a semicolon at the end of an expresson statement, while we got a " + ${this.tokenizer.peek().text}`);
      }
    } else {
      console.warn('Error parsing ExpressionStatement')
    }
    return null
  }
  /**
   * 解析变量声明。语法规则：
   * 
   * variableDecl : 'let'? Identifier typeAnnotation? ('=' singleExpression) ';';
   * typeAnnotation: ':' Identifier
   */
  parseVariableDecl() {
    let { next, peek } = this.tokenizer
    next = next.bind(this.tokenizer)
    peek = peek.bind(this.tokenizer)
    next()
    const token = next()
    if (token.kind === TokenKind.Identifier) {
      const varName = token.text
      let varType = 'any'
      let init:Expression|null=null
      let t1 = peek()
      if (t1.text === ':') {
        next()
        t1 = peek()
        if (t1.kind === TokenKind.Identifier) {
          next()
          varType = t1.text
          t1 = peek()
        } else {
          console.log("Error parsing type annotation in VariableDecl");
          return null;
        }
      }
      if (t1.text === '=') {
        next()
        init = this.parseExpression()
      }
      t1 = peek()
      if (t1.text === ';') {
        next()
        return new VariableDecl(varName, varType, init)
      } else {
        console.warn(`Expecting ; at the end of varaible declaration, while we meet ${t1.text}`);
        return null;
      }
    } else {
      console.warn(`Expecting variable name in VariableDecl, while we meet ${token.text}`);
      return null;
    }
  }
  /**
   * 解析函数调用。语法规则：
   * 
   * functionCall: Identifier '(' parameterList? ')' ;
   * parameterList: Expression (',' Expression)* ;
   */
  parseFunctionCall() {
    let {peek, next} = this.tokenizer
    peek = peek.bind(this.tokenizer)
    next = next.bind(this.tokenizer)
    const params: Expression[] = []
    const { kind, text } = next()
    if (kind === TokenKind.Identifier) {
      let t1 = next()
      if (t1.text === '(') {
        t1 = peek()
        while (t1.text !== ')') {
          const exp = this.parseExpression()
          if (exp) {
            params.push(exp)
          } else {
            console.warn("Error parsing parameter in function call");
            return null; 
          }
          t1 = peek()
          if (t1.text !== ')') {
            if (t1.text === ',') {
              t1 = next()
            } else {
              console.warn(`Expecting a comma in FunctionCall, while we got a ${t1.text}`)
              return null
            }
          }
        }
        t1 = next()
        return new FunctionCall(text, params)
        // if (t1.text === ';') return new FunctionCall(text, params)
        
        // console.warn(`Expecting a semicolon in FunctionCall, while we got a ${t1.text}`)
        // return null
      } else return null
    } else return null
  }
  /**
   * 解析函数体。语法规则：
   * 
   * functionBody: '{' Block* '}' ;
   */
  parseFunctionBody() {
    let { text, kind } = this.tokenizer.peek()
    if (text === '{') {
      this.tokenizer.next()
      const stmts = this.parseStatementList();
      ({ kind, text } = this.tokenizer.next())
      if (text === '}') return new Block(stmts)
      else {
        console.warn(`Expecting '}' in FunctionBody, while we got a ${text}`)
        return null
      }
    } else {
      console.warn(`Expecting '{' in FunctionDecl, while we got a ${text}`)
      return null
    }
  }
  /**
   * 解析函数声明。语法规则：
   * 
   * functionDecl: "function" Identifier '(' ')' functionBody ;
   */
  parseFunctionDecl() {
    this.tokenizer.next()
    const {kind, text} = this.tokenizer.next()
    if (kind === TokenKind.Identifier) {
      const t1 = this.tokenizer.next()
      if (t1.text === '(') {
        const t2 = this.tokenizer.next()
        if (t2.text === ')') {
          const functionBody = this.parseFunctionBody()
          if (functionBody) return new FunctionDecl(text, functionBody)
          else {
            console.warn(`Error parsing FunctionBody in FunctionDecl`)
            return null
          }
        } else {
          console.warn(`Expecting ')' in FunctionDecl, while we got a ${text}`)
          return null
        }
      } else {
        console.warn(`Expecting '(' in FunctionDecl, while we got a ${text}`)
        return null
      }
    } else return null
  }
  /** 需要预读两个token来区分函数调用、变量声明和变量赋值 */
  parseStatement() {
    const { kind, text } = this.tokenizer.peek()
    if (text === 'function') return this.parseFunctionDecl()
    else if (text === 'let') return this.parseVariableDecl()
    else if ([
      TokenKind.Identifier,
      TokenKind.DecimalLiteral,
      TokenKind.IntegerLiteral,
      TokenKind.StringLiteral,
    ].includes(kind) || text === '(') return this.parseExpressionStatement()
    else {
      console.warn(`Cannot recognize an expression starting with ${this.tokenizer.peek().text}`)
      return null
    }
  }
  parseStatementList() {
    const stmts: Statement[] = []
    let t = this.tokenizer.peek()
    // TODO: thinking why
    while (t.kind !== TokenKind.EOF && t.text !== '}') {
      const stmt = this.parseStatement()
      if (stmt) stmts.push(stmt)
      t = this.tokenizer.peek()
    }
    return stmts
  }

}