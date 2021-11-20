import { AstVisitor, BinaryExpression, FunctionCall, Variable, VariableDecl, Prog } from "./abstract-syntac-tree";
import { Scope } from "./scope";
import { Symbol } from "./semantic-analyzer";

class LeftValue {
  /** 
   * 判断是不是左值。目前为止左值只能为变量，所以意思等价于判断是不是变量
   * */ 
  static isLeftValue(value: any): value is LeftValue {
    return value instanceof LeftValue
  }
  constructor(public variable: Variable) {}
}

export class Interpretor extends AstVisitor {
  currentScope: Scope<Symbol>|null = null
  visitProg(prog: Prog) {
    this.currentScope = prog.scope
    super.visitProg(prog)
    this.currentScope = null
  }
  // 覆盖父级行为
  visitFunctionDecl() {}
  visitFunctionCall(functionCall: FunctionCall) {
    if (functionCall.name === 'println') {
      const res = []
      for (let i = 0; i < functionCall.params.length; i++) {
        // visit方法如果遇到Variable会调用visitVariable，在这里visitVariable被改写了，会返回包裹了变量的LeftValue实例
        let returnValue = this.visit(functionCall.params[i])
        if (LeftValue.isLeftValue(returnValue)) {
          returnValue = this.getVariableValue(returnValue.variable.name)
        }
        res.push(returnValue)
      }
      console.log(...res)
    } else {
      if (functionCall.defination) {
        const tmpScope = this.currentScope
        this.currentScope = functionCall.defination.scope
        this.visitBlock(functionCall.defination.body)
        this.currentScope = tmpScope
      }
    }
  }
  visitVariableDecl(variableDecl: VariableDecl) {
    if (variableDecl.init) {
      // visit方法如果遇到Variable会调用visitVariable，在这里visitVariable被改写了，会返回包裹了变量的LeftValue实例
      let value = this.visit(variableDecl.init)
      // 如果是变量还得拿一下变量值
      if (LeftValue.isLeftValue(value)) {
        value = this.getVariableValue(value.variable.name)
      }
      this.setVariableValue(variableDecl.name, value)
      return value
    }
  }
  visitBinaryExpression(be: BinaryExpression) {
    // visit方法如果遇到Variable会调用visitVariable，在这里visitVariable被改写了，会返回包裹了变量的LeftValue实例
    let value1 = this.visit(be.exp1)
    let value2 = this.visit(be.exp2)
    let variableOfValue1
    // 如果是变量还得拿一下变量值
    if (LeftValue.isLeftValue(value1)) {
      variableOfValue1 = value1
      value1 = this.getVariableValue(value1.variable.name)
    }
    if (LeftValue.isLeftValue(value2)) {
      value2 = this.getVariableValue(value2.variable.name)
    }
    let res;
    switch (be.op) {
      case '+': {
        res = value1 + value2
        break
      }
      case '-': {
        res = value1 - value2
        break
      }
      case '*': {
        res = value1 * value2
        break
      }
      case '/': {
        res = value1 / value2
        break
      }
      case '%': {
        res = value1 % value2
        break
      }
      case '>': {
        res = value1 > value2
        break
      }
      case '<': {
        res = value1 < value2
        break
      }
      case '>=': {
        res = value1 >= value2
        break
      }
      case '<=': {
        res = value1 <= value2
        break
      }
      case '&&': {
        res = value1 && value2
        break
      }
      case '||': {
        res = value1 || value2
        break
      }
      case '=': {
        if (LeftValue.isLeftValue(variableOfValue1)) {
          this.setVariableValue(variableOfValue1.variable.name, value2)
        } else {
          console.warn("Assignment need a left value while we got a " + value1)
        }
        break
      }
      default: {
        console.warn(`Unsupported binary operation: ${be.op}`)
      }
    }
    return res
  }
  // 改写父级的同名方法
  visitVariable(variable: Variable) {
    return new LeftValue(variable)
  }
  getVariableValue(vName: string) {
    return this.currentScope?.getRecord(vName)!.value
    // return this.valueTable.get(vName)
  }
  setVariableValue(vName: string, value: unknown) {
    const record = this.currentScope?.getRecord(vName)
    if (record) record.value = value
    // return this.valueTable.set(vName, value)
  }
}