import { Decl, AstVisitor, FunctionDecl, FunctionCall, VariableDecl, Variable } from "./abstract-syntac-tree";

export enum SymbolKind {
  Variable, Function, Class, Interface
}

class Symbol {
  constructor(public name: string, public decl: Decl, public kind: SymbolKind) {}
}

export class SymbolTable {
  table = new Map<string, Symbol>()
  // constructor(public name: string, public decl: Decl, public symbolType: SymbolKind) {}

  enter(...args: [string, Decl, SymbolKind]) {
    this.table.set(args[0], new Symbol(...args))
  }
  hasSymbol(name: string) {
    return this.table.has(name)
  }
  getSymbol(name: string) {
    return this.table.get(name) || null
  }
}

export class Enter extends AstVisitor {
  constructor(public symbolTable: SymbolTable) {
    super()
  }
  visitFunctionDecl(functionDecl: FunctionDecl) {
    if (this.symbolTable.hasSymbol(functionDecl.name)) {
      console.warn(`Duplicate symbol: ${functionDecl.name}`)
    }
    this.symbolTable.enter(functionDecl.name, functionDecl, SymbolKind.Function)
  }
  visitVariableDecl(variableDecl: VariableDecl) {
    if (this.symbolTable.hasSymbol(variableDecl.name)) {
      console.warn(`Duplicate symbol: ${variableDecl.name}`)
    }
    this.symbolTable.enter(variableDecl.name, variableDecl, SymbolKind.Variable)
  }
}

export class RefResolver extends AstVisitor {
  constructor(public symbolTable: SymbolTable) { super() }

  visitFunctionCall(functionCall: FunctionCall) {
    const symbol = this.symbolTable.getSymbol(functionCall.name)
    if (symbol?.kind === SymbolKind.Function) functionCall.defination = symbol.decl as FunctionDecl
    else if (functionCall.name !== 'println') {
      console.error(`Cannot find declaration of function ${functionCall.name}`)
    }
  }

  visitVariable(variable: Variable) {
    const symbol = this.symbolTable.getSymbol(variable.name)
    if (symbol?.kind === SymbolKind.Function) variable.decl = symbol.decl as VariableDecl
    else if (variable.name !== 'println') {
      console.error(`Cannot find declaration of variable ${variable.name}`)
    }
  }
}