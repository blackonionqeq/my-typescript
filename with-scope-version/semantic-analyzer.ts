import { Decl, AstVisitor, FunctionDecl, FunctionCall, VariableDecl, Variable, Prog } from "./abstract-syntac-tree";
import { Scope } from "./scope";

export enum SymbolKind {
  Variable, Function, Class, Interface, Unknown
}

export class Symbol {
  value: unknown = undefined
  constructor(public kind = SymbolKind.Unknown) {}
}
export class VariableSymbol extends Symbol {
  constructor(public decl: VariableDecl) {
    super(SymbolKind.Variable)
  }
}
export class FuncSymbol extends Symbol {
  constructor(public decl: FunctionDecl) {
    super(SymbolKind.Function)
  }
}
// 旧版实现，因为加入作用域而需要重构
// class Symbol {
//   constructor(public name: string, public decl: Decl, public kind: SymbolKind) {}
// }

// export class SymbolTable {
//   table = new Map<string, Symbol>()
//   // constructor(public name: string, public decl: Decl, public symbolType: SymbolKind) {}

//   enter(...args: [string, Decl, SymbolKind]) {
//     this.table.set(args[0], new Symbol(...args))
//   }
//   hasSymbol(name: string) {
//     return this.table.has(name)
//   }
//   getSymbol(name: string) {
//     return this.table.get(name) || null
//   }
// }
// export class Enter extends AstVisitor {
//   constructor(public symbolTable: SymbolTable) {
//     super()
//   }
//   visitFunctionDecl(functionDecl: FunctionDecl) {
//     if (this.symbolTable.hasSymbol(functionDecl.name)) {
//       console.warn(`Duplicate symbol: ${functionDecl.name}`)
//     }
//     this.symbolTable.enter(functionDecl.name, functionDecl, SymbolKind.Function)
//   }
//   visitVariableDecl(variableDecl: VariableDecl) {
//     if (this.symbolTable.hasSymbol(variableDecl.name)) {
//       console.warn(`Duplicate symbol: ${variableDecl.name}`)
//     }
//     this.symbolTable.enter(variableDecl.name, variableDecl, SymbolKind.Variable)
//   }
// }

// 为什么要分enter和refresolver?
// 因为js允许对函数和var变量的变量提升，即允许使用先于定义，所以要先过一遍定义
export class Enter extends AstVisitor {
  currentScope: Scope<Symbol>|null = null
  visitProg(prog: Prog) {
    // 根节点的scope的父级为空
    prog.scope = new Scope<Symbol>(null)
    this.currentScope = prog.scope
    super.visitProg(prog)
    this.currentScope = null
  }
  visitFunctionDecl(functionDecl: FunctionDecl) {
    const tmpScope = this.currentScope
    // 更新当前作用域，以便访问函数体遇到声明时，写的是当前作用域
    this.currentScope = new Scope<Symbol>(tmpScope)
    functionDecl.scope = this.currentScope
    // 把函数声明记录到父级作用域内
    tmpScope?.setRecord(functionDecl.name, new FuncSymbol(functionDecl))
    // tmpScope!.environmentRecords[functionDecl.name] = new FuncSymbol(functionDecl)
    // 进入函数体找声明
    super.visitFunctionDecl(functionDecl)
    // 恢复父级作用域
    this.currentScope = tmpScope
  }
  visitVariableDecl(variableDecl: VariableDecl) {
    this.currentScope?.setRecord(variableDecl.name, new VariableSymbol(variableDecl))
    // this.currentScope!.environmentRecords[variableDecl.name] = new VariableSymbol(variableDecl)
    variableDecl.scope = this.currentScope!
  }
}


// export class RefResolver extends AstVisitor {
//   constructor(public symbolTable: SymbolTable) { super() }

//   visitFunctionCall(functionCall: FunctionCall) {
//     const symbol = this.symbolTable.getSymbol(functionCall.name)
//     if (symbol?.kind === SymbolKind.Function) functionCall.defination = symbol.decl as FunctionDecl
//     else if (functionCall.name !== 'println') {
//       console.error(`Cannot find declaration of function ${functionCall.name}`)
//     }
//   }

//   visitVariable(variable: Variable) {
//     const symbol = this.symbolTable.getSymbol(variable.name)
//     if (symbol?.kind === SymbolKind.Function) variable.decl = symbol.decl as VariableDecl
//     else if (variable.name !== 'println') {
//       console.error(`Cannot find declaration of variable ${variable.name}`)
//     }
//   }
// }

export class RefResolver extends AstVisitor {
  currentScope: Scope<Symbol>|null = null
  visitProg(prog: Prog) {
    this.currentScope = prog.scope
    super.visitProg(prog)
    this.currentScope = null
  }
  visitFunctionCall(functionCall: FunctionCall) {
    const target = this.currentScope?.getRecord(functionCall.name)
    if (target instanceof FuncSymbol) {
      functionCall.defination = target.decl
    } else if (!target) {
      console.error(`Cannot find declaration of function ${functionCall.name}`)
    }
  }
  visitVariable(variable: Variable) {
    const target = this.currentScope?.getRecord(variable.name)
    if (target instanceof VariableSymbol) {
      variable.decl = target.decl
    } else if (!target) {
      console.error(`Cannot find declaration of variable ${variable.name}`)
    }
  }
}

