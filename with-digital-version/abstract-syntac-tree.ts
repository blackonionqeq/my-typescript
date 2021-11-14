export abstract class AstNode {
  // 打印子树信息，用于缩进显示
  abstract dump(prefix: string): void

  // 给astvisitor访问的能力
  abstract accept(visitor: AstVisitor): any
}

export abstract class AstVisitor {
  visit(node: AstNode) {
    return node.accept(this)
  }
  visitProg(prog: Prog) {
    let returnValue
    for (let i = 0; i < prog.stmts.length; i++) {
      returnValue = this.visit(prog.stmts[i])
    }
    return returnValue
  }
  visitVariableDecl(variableDecl: VariableDecl) {
    if (variableDecl.init) return this.visit(variableDecl.init)
  }
  visitBlock(block: Block) {
    let returnValue
    for (let i = 0; i < block.stmts.length; i++) {
      returnValue = this.visit(block.stmts[i])
    }
    return returnValue
  }
  visitFunctionDecl(functionDecl: FunctionDecl) {
    return this.visitBlock(functionDecl.body)
  }
  visitExpressionStatement(stmt: ExpressionStatement) {
    return this.visit(stmt.exp)
  }
  visitBinaryExpression(exp: BinaryExpression) {
    this.visit(exp.exp1)
    this.visit(exp.exp2)
  }
  visitIntegerLiteral(exp: IntegerLiteral) {
    return exp.value
  }
  visitDecimalLiteral(exp: DecimalLiteral) {
    return exp.value
  }
  visitStringLiteral(exp: StringLiteral) {
    return exp.value
  }
  visitNullLiteral(exp: NullLiteral) {
    return exp.value
  }
  visitBooleanLiteral(exp: BooleanLiteral) {
    return exp.value
  }
  visitVariable(exp: Variable) {
    // return null
  }
  visitFunctionCall(exp: FunctionCall) {
    // return null
  }
}

/** 语句
 * 包括函数声明、表达式语句
 */
export abstract class Statement extends AstNode {}

export abstract class Expression extends AstNode {}

/**
 * 表达式语句。
 * 即表达式后加个分号
 */
export class ExpressionStatement extends Statement {
  constructor(public exp: Expression) {
    super()
  }
  dump(prefix: string) {
    console.log(prefix+'ExpressionStatement')
    this.exp.dump(prefix+'\t')
  }
  accept(visitor: AstVisitor) {
    return visitor.visitExpressionStatement(this)
  }
}

export abstract class Decl extends Statement {
  constructor(public name: string) {super()}
}

export class BinaryExpression extends Expression {
  constructor(public op: string, public exp1: Expression, public exp2: Expression) {
    super()
  }
  dump(prefix: string) { 
    console.log(`${prefix}Binary:${this.op}`)
    this.exp1.dump(`${prefix}\t`)
    this.exp2.dump(`${prefix}\t`)
  }
  accept(visitor: AstVisitor) {
    return visitor.visitBinaryExpression(this)
  }
}

export class StringLiteral extends Expression {
  constructor(public value: string) {
    super()
  }
  dump(prefix: string) { console.log(`${prefix}${this.value}`) }
  accept(visitor: AstVisitor) {
    return visitor.visitStringLiteral(this)
  }
}
export class NullLiteral extends Expression {
  constructor(public value: null) {
    super()
  }
  dump(prefix: string) { console.log(`${prefix}${this.value}`) }
  accept(visitor: AstVisitor) {
    return visitor.visitNullLiteral(this)
  }
}
export class BooleanLiteral extends Expression {
  constructor(public value: boolean) {
    super()
  }
  dump(prefix: string) { console.log(`${prefix}${this.value}`) }
  accept(visitor: AstVisitor) {
    return visitor.visitBooleanLiteral(this)
  }
}
export class VariableDecl extends Decl {
  constructor(public name: string, public varType: string, public init: Expression|null) {
    super(name)
  }
  dump(prefix: string) {
    console.log(`${prefix}VariableDecl ${this.name}, type: ${this.varType}`)
    if (!this.init) console.log(`${prefix}no initialization`)
    else this.init.dump(prefix+'\t')
  }
  accept(visitor: AstVisitor) {
    return visitor.visitVariableDecl(this)
  }
}

export class Variable extends Expression {
  decl: VariableDecl|null = null
  constructor(public name: string) {
    super()
  }
  dump(prefix: string) {
    console.log(`${prefix}Variable: ${this.name} ${this.decl ? ', resolved' : ', not resolved'}`)
  }
  
  accept(visitor: AstVisitor) {
    return visitor.visitVariable(this)
  }
}

export class IntegerLiteral extends Expression {
  constructor(public value: number) {
    super()
  }
  dump(prefix: string) { console.log(`${prefix}${this.value}`) }
  accept(visitor: AstVisitor) {
    return visitor.visitIntegerLiteral(this)
  }
}
export class DecimalLiteral extends Expression {
  constructor(public value: number) {
    super()
  }
  dump(prefix: string) { console.log(`${prefix}${this.value}`) }
  accept(visitor: AstVisitor) {
    return visitor.visitDecimalLiteral(this)
  }
}

export class Block extends AstNode {
  constructor(public stmts: Statement[]) {
    super()
  }
  dump(prefix: string) {
    console.log(`${prefix}Block`)
    console.log(this.stmts.map(i => i.dump(`${prefix}\t`)).join('\n'))
  }
  accept(visitor: AstVisitor) {
    return visitor.visitBlock(this)
  }
}

export class Prog extends Block {
  dump(prefix: string) {
    console.log(`${prefix}Prog`)
    console.log(this.stmts.map(i => i.dump(`${prefix}\t`)).join('\n'))
  }
  accept(visitor: AstVisitor) {
    return visitor.visitProg(this)
  }
}

export class FunctionDecl extends Decl {
  constructor(public name: string, public body: Block) {
    super(name)
  }
  dump(prefix: string) {
    console.log(prefix+'FunctionDecl '+this.name)
    this.body.dump(prefix+'\t')
  }
  accept(visitor: AstVisitor) {
    return visitor.visitFunctionDecl(this)
  }
}

export class FunctionCall extends Expression {
  defination: FunctionDecl|null = null
  constructor(public name: string, public params: Expression[]) {
    super()
  }
  dump(prefix: string) {
    console.log(prefix+`FunctionCall ${this.name} ${this.defination ? ", resolved" : ", not resolved"}`);
    console.log(this.params.map(p => `${prefix}\tParameter: ${p}`).join('\n'))
  }
  accept(visitor: AstVisitor) {
    return visitor.visitFunctionCall(this)
  }
}