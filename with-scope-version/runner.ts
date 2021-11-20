import { Interpretor } from "./interpreter";
import { Parser } from "./parser";
import { CharStream } from "./public";
import { Enter, RefResolver } from "./semantic-analyzer";
import { Tokenizer } from "./tokenizer";

function compileThenRun(code: string) {
  // 词法分析
  const tokenizer = new Tokenizer(new CharStream(code))
  console.log('已完成词法分析')
  // 语法分析
  const ast = new Parser(tokenizer).parseProg()
  console.log('已完成语法分析')
  // 语义分析
  new Enter().visit(ast)
  new RefResolver().visit(ast)
  console.log('已完成语义分析')
  ast.dump('')
  new Interpretor().visit(ast)
}

const code = `
let a = "global";
function test1() {
  let a = "test1";
  test2();
}
function test2() {
  println(a);
}
test1();
`

compileThenRun(code)