import { Interpretor } from "./interpreter";
import { Parser } from "./parser";
import { CharStream } from "./public";
import { Enter, RefResolver, SymbolTable } from "./semantic-analyzer";
import { Tokenizer } from "./tokenizer";

function compileThenRun(code: string) {
  // 词法分析
  const tokenizer = new Tokenizer(new CharStream(code))
  console.log('已完成词法分析')
  // 语法分析
  const ast = new Parser(tokenizer).parseProg()
  console.log('已完成语法分析')
  // 语义分析
  const symbolTable = new SymbolTable()
  new Enter(symbolTable).visit(ast)
  new RefResolver(symbolTable).visit(ast)
  console.log('已完成语义分析')
  ast.dump('')
  new Interpretor().visit(ast)
}

const code = `
let myAge:number = 18;
function aa() {
myAge = myAge + 10;
}
println("myAge is");
println(myAge);
aa();
println("myAge is");
println(myAge);
`

compileThenRun(code)