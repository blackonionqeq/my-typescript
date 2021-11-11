"use strict";
var TokenKind;
(function (TokenKind) {
    TokenKind[TokenKind["Keyword"] = 0] = "Keyword";
    TokenKind[TokenKind["Identifier"] = 1] = "Identifier";
    TokenKind[TokenKind["StringLiteral"] = 2] = "StringLiteral";
    TokenKind[TokenKind["Seperator"] = 3] = "Seperator";
    TokenKind[TokenKind["Operator"] = 4] = "Operator";
    TokenKind[TokenKind["EOF"] = 5] = "EOF";
})(TokenKind || (TokenKind = {}));
class CharStream {
    data;
    pos = 0;
    line = 1;
    col = 0;
    constructor(data) {
        this.data = data;
    }
    peek() { return this.data.charAt(this.pos); }
    isEof() { return this.peek() === ''; }
    next() {
        const ch = this.data.charAt(this.pos++);
        if (ch === '\n') {
            this.line++;
            this.col = 0;
        }
        else
            this.col++;
        return ch;
    }
}
const charStream = `function sayHello(){
  println("Hello world", "Hello world2");
}
sayHello();`;
const tokenArray = [
    { kind: TokenKind.Keyword, text: 'function' },
    { kind: TokenKind.Identifier, text: 'sayHello' },
    { kind: TokenKind.Seperator, text: '(' },
    { kind: TokenKind.Seperator, text: ')' },
    { kind: TokenKind.Seperator, text: '{' },
    { kind: TokenKind.Identifier, text: 'println' },
    { kind: TokenKind.Seperator, text: '(' },
    { kind: TokenKind.StringLiteral, text: 'Hello World!' },
    { kind: TokenKind.Seperator, text: ',' },
    { kind: TokenKind.StringLiteral, text: 'Hello World2!' },
    { kind: TokenKind.Seperator, text: ')' },
    { kind: TokenKind.Seperator, text: ';' },
    { kind: TokenKind.Seperator, text: '}' },
    { kind: TokenKind.Identifier, text: 'sayHello' },
    { kind: TokenKind.Seperator, text: '(' },
    { kind: TokenKind.Seperator, text: ')' },
    { kind: TokenKind.Seperator, text: ';' },
    { kind: TokenKind.EOF, text: '' }
];
/** 词法分析器 */
class Tokenizer {
    code;
    // pos = 0
    // // constructor(public tokens: Token[]) {}
    // next() {
    //   if (this.pos <= this.tokens.length) {
    //     return this.tokens[this.pos++]
    //   } else return this.tokens[this.pos]
    // }
    // traceBack(newPos: number) {
    //   this.pos = newPos
    // }
    // private current!: Token
    nextToken;
    constructor(code) {
        this.code = code;
        this.nextToken = this.getNextToken();
        console.log(this.nextToken);
    }
    peek() {
        return this.nextToken;
    }
    next() {
        const res = this.nextToken;
        this.nextToken = this.getNextToken();
        return res;
    }
    getNextToken() {
        this.skipWhiteSpaces();
        if (this.code.isEof())
            return { kind: TokenKind.EOF, text: '' };
        else {
            const c = this.code.peek();
            if (this.isDigit(c) || this.isLetter(c)) {
                return this.parseIdentifier();
            }
            else if (this.isSeperator(c)) {
                this.code.next();
                return { kind: TokenKind.Seperator, text: c };
            }
            else if (c === '"') {
                return this.parseStringLiteral();
            }
            else if (c === '/') {
                this.code.next();
                const c1 = this.code.peek();
                switch (c1) {
                    case '*': {
                        this.skitMultiLineComments();
                        return this.getNextToken();
                    }
                    case '/': {
                        this.skipSingleLineComments();
                        return this.getNextToken();
                    }
                    case '=': {
                        this.code.next();
                        return { kind: TokenKind.Operator, text: '/=' };
                    }
                    default: {
                        return { kind: TokenKind.Operator, text: '/' };
                    }
                }
            }
            else if (c === '*') {
                this.code.next();
                if (this.code.peek() === '=') {
                    this.code.next();
                    return { kind: TokenKind.Operator, text: '*=' };
                }
                else
                    return { kind: TokenKind.Operator, text: '*' };
            }
            else if (c === '+') {
                this.code.next();
                const c1 = this.code.peek();
                if (c1 === '=') {
                    this.code.next();
                    return { kind: TokenKind.Operator, text: '+=' };
                }
                else if (c1 === '+') {
                    this.code.next();
                    return { kind: TokenKind.Operator, text: '++' };
                }
                else
                    return { kind: TokenKind.Operator, text: '+' };
            }
            else if (c === '-') {
                this.code.next();
                const c1 = this.code.peek();
                if (c1 === '=') {
                    this.code.next();
                    return { kind: TokenKind.Operator, text: '-=' };
                }
                else if (c1 === '-') {
                    this.code.next();
                    return { kind: TokenKind.Operator, text: '--' };
                }
                else
                    return { kind: TokenKind.Operator, text: '-' };
            }
            else {
                console.warn(`Unrecognized pattern meeting '${c}', at ${this.code.line} col: ${this.code.col}'`);
                this.code.next();
                return this.getNextToken();
            }
        }
    }
    parseIdentifier() {
        const token = { kind: TokenKind.Identifier, text: '' };
        // 第一个字符已在调用处判断过
        token.text += this.code.next();
        while (!this.code.isEof() &&
            this.isLetterOrUnderscore(this.code.peek()))
            token.text += this.code.next();
        // 识别关键字
        if (token.text === 'function')
            token.kind = TokenKind.Keyword;
        return token;
    }
    parseStringLiteral() {
        const token = { kind: TokenKind.StringLiteral, text: this.code.next() };
        while (!this.code.isEof() &&
            this.code.peek() !== '"')
            token.text += this.code.next();
        if (this.code.peek() === '"')
            token.text += this.code.next();
        return token;
    }
    skipWhiteSpaces() { while (this.isWhiteSpace(this.code.peek()))
        this.code.next(); }
    isWhiteSpace(ch) { return ch === ' ' || ch === '\n' || ch === '\t'; }
    isLetter(ch) { return ch >= 'A' && ch <= 'Z' || ch >= 'a' && ch <= 'z'; }
    isDigit(ch) { return ch >= '0' && ch <= '9'; }
    isLetterOrUnderscore(ch) { return this.isLetter(ch) || this.isDigit(ch) || ch === '_'; }
    isSeperator(ch) { return ['(', ')', '{', '}', ';', ','].includes(ch); }
    skitMultiLineComments() {
        this.code.next();
        if (!this.code.isEof()) {
            let c1 = this.code.next();
            while (!this.code.isEof()) {
                let c2 = this.code.next();
                if (c1 === '*' && c2 === '/')
                    return;
                else
                    c1 = c2;
            }
        }
    }
    skipSingleLineComments() {
        this.code.next();
        while (!this.code.isEof() &&
            this.code.peek() !== '/')
            this.code.next();
    }
}
class AstNode {
}
/** 语句 */
class Statement extends AstNode {
    static isStatement(node) {
        if (!node)
            return false;
        if (Object.getPrototypeOf(node) === Statement.prototype)
            return true;
        return false;
    }
}
/** 程序根节点 */
class Prog extends AstNode {
    stmts;
    constructor(stmts) {
        super();
        this.stmts = stmts;
    }
    dump(prefix) {
        console.log(prefix + 'Prog');
        this.stmts.forEach(x => x.dump(prefix + '\t'));
    }
}
/** 函数声明节点 */
class FunctionDecl extends Statement {
    name;
    body;
    constructor(name, body) {
        super();
        this.name = name;
        this.body = body;
    }
    dump(prefix) {
        console.log(`${prefix}FunctionDecl ${this.name}`);
        this.body.dump(prefix + '\t');
    }
}
/** 函数体 */
class FunctionBody extends AstNode {
    stmts;
    constructor(stmts) {
        super();
        this.stmts = stmts;
    }
    dump(prefix) {
        console.log(prefix + "FunctionBody");
        this.stmts.forEach(x => x.dump(prefix + '\t'));
    }
    static isFunctionBodyNode(node) {
        if (!node)
            return false;
        if (Object.getPrototypeOf(node) === FunctionBody.prototype)
            return true;
        return false;
    }
}
/** 函数调用 */
class FunctionCall extends Statement {
    name;
    parameters;
    definition = null;
    constructor(name, parameters) {
        super();
        this.name = name;
        this.parameters = parameters;
    }
    static isFunctionCallNode(node) {
        if (!node)
            return false;
        if (Object.getPrototypeOf(node) === FunctionCall.prototype)
            return true;
        return false;
    }
    dump(prefix) {
        console.log(prefix + `FunctionCall ${this.name} ${this.definition ? ", resolved" : ", not resolved"}`);
        console.log(this.parameters.map(p => `${prefix}\tParameter: ${p}`).join('\n'));
        // this.parameters.forEach(x => console.log(prefix + "\t" + "Parameter: " + x));
    }
}
/** 语法分析器 */
class Parser {
    tokenizer;
    constructor(tokenizer) {
        this.tokenizer = tokenizer;
    }
    // parseProg() {
    //   const stmts: Statement[] = []
    //   let stmt: Statement|null = null
    //   debugger
    //   while (true) {
    //     stmt = this.parseFunctionDecl()
    //     if (stmt) {
    //       stmts.push(stmt)
    //       continue
    //     }
    //     stmt = this.parseFunctionCall()
    //     if (stmt) {
    //       stmts.push(stmt)
    //       continue
    //     }
    //     if (stmt === null) break
    //   }
    //   console.log(stmts)
    //   return new Prog(stmts)
    // }
    // parseFunctionDecl() {
    //   const oldPos = this.tokenizer.pos
    //   let t = this.tokenizer.next()
    //   if (t.kind === TokenKind.Keyword && t.text === 'function') {
    //     t = this.tokenizer.next()
    //     if (t.kind === TokenKind.Identifier) {
    //       const t1 = this.tokenizer.next()
    //       if (t1.text === '(') {
    //         const t2 = this.tokenizer.next()
    //         if (t2.text === ')') {
    //           const functionBody = this.parseFunctionBody()
    //           if (FunctionBody.isFunctionBodyNode(functionBody)) return new FunctionDecl(t.text, functionBody)
    //         } else {
    //           console.log("Expecting ')' in FunctionDecl, while we got a " + t.text);
    //           return null;
    //         }
    //       } else{
    //         console.log("Expecting '(' in FunctionDecl, while we got a " + t.text);
    //         return null;
    //       }   
    //     }
    //   }
    //   this.tokenizer.traceBack(oldPos)
    //   return null
    // }
    // parseFunctionBody() {
    //   const stmts: FunctionCall[] = []
    //   let t = this.tokenizer.next()
    //   if (t.text === '{') {
    //     let functionCall = this.parseFunctionCall()
    //     while (FunctionCall.isFunctionCallNode(functionCall)) {
    //       stmts.push(functionCall)
    //       functionCall = this.parseFunctionCall()
    //     }
    //     t = this.tokenizer.next()
    //     if (t.text === '}') return new FunctionBody(stmts)
    //     else {
    //       console.log("Expecting '}' in FunctionBody, while we got a " + t.text);
    //       return null;
    //     }
    //   } else {
    //     console.log("Expecting '{' in FunctionBody, while we got a " + t.text);
    //     return null;
    //   }
    // }
    // parseFunctionCall() {
    //   const oldPos = this.tokenizer.pos
    //   const params:string[] = []
    //   const t = this.tokenizer.next()
    //   if (t.kind === TokenKind.Identifier) {
    //     const t1 = this.tokenizer.next()
    //     if (t1.text === '(') {
    //       let t2 = this.tokenizer.next()
    //       while (t2.text !== ')') {
    //         if (t2.kind === TokenKind.StringLiteral) {
    //           params.push(t2.text)
    //           t2 = this.tokenizer.next()
    //           if (t2.text !== ')') {
    //             if (t2.text === ',') t2 = this.tokenizer.next()
    //             else {
    //               console.log("Expecting a comma in FunctionCall, while we got a " + t2.text);
    //               return null;
    //             }
    //           }
    //         }
    //         else {
    //           console.log("Expecting parameter in FunctionCall, while we got a " + t2.text);
    //           return null;
    //         }
    //       }
    //       t2 = this.tokenizer.next()
    //       if (t2.text === ';') return new FunctionCall(t.text, params)
    //       else {
    //         console.log("Expecting a comma in FunctionCall, while we got a " + t2.text);
    //         return null;
    //       }
    //     }
    //   }
    //   this.tokenizer.traceBack(oldPos)
    //   return null
    // }
    /**
     * 解析函数调用。语法规则：
     *
     * functionCall: Identifier '(' parameterList? ')' ;
     * parameterList: StringLiteral (',' StringLiteral)* ;
     */
    parseFunctionCall() {
        const params = [];
        const { kind, text } = this.tokenizer.next();
        if (kind === TokenKind.Identifier) {
            const t1 = this.tokenizer.next();
            if (t1.text === '(') {
                let t2 = this.tokenizer.next();
                while (t2.text !== ')') {
                    if (t2.kind === TokenKind.StringLiteral) {
                        params.push(t2.text);
                    }
                    else {
                        console.warn(`Expecting StringLiteral parameter in FunctionCall, while we got a ${t2.text}`);
                        return null;
                    }
                    t2 = this.tokenizer.next();
                    if (t2.text !== ')') {
                        if (t2.text === ',') {
                            t2 = this.tokenizer.next();
                        }
                        else {
                            console.warn(`Expecting a comma in FunctionCall, while we got a ${t2.text}`);
                            return null;
                        }
                    }
                }
                t2 = this.tokenizer.next();
                if (t2.text === ';')
                    return new FunctionCall(text, params);
                console.warn(`Expecting a semicolon in FunctionCall, while we got a ${t2.text}`);
                return null;
            }
            else
                return null;
        }
        else
            return null;
    }
    /**
     * 解析函数体。语法规则：
     *
     * functionBody: '{' functionCall* '}' ;
     */
    parseFunctionBody() {
        const stmts = [];
        let { text, kind } = this.tokenizer.next();
        if (text === '{') {
            while (this.tokenizer.peek().kind === TokenKind.Identifier) {
                const functionCall = this.parseFunctionCall();
                if (functionCall)
                    stmts.push(functionCall);
                else {
                    console.warn(`Error parsing FunctionCall in FunctionBody`);
                    return null;
                }
            }
            ;
            ({ kind, text } = this.tokenizer.next());
            if (text === '}')
                return new FunctionBody(stmts);
            else {
                console.warn(`Expecting '}' in FunctionBody, while we got a ${text}`);
                return null;
            }
        }
        else {
            console.warn(`Expecting '{' in FunctionDecl, while we got a ${text}`);
            return null;
        }
    }
    /**
     * 解析函数声明。语法规则：
     *
     * functionDecl: "function" Identifier '(' ')' functionBody ;
     */
    parseFunctionDecl() {
        this.tokenizer.next();
        const { kind, text } = this.tokenizer.next();
        if (kind === TokenKind.Identifier) {
            const t1 = this.tokenizer.next();
            if (t1.text === '(') {
                const t2 = this.tokenizer.next();
                console.log(t2);
                if (t2.text === ')') {
                    const functionBody = this.parseFunctionBody();
                    if (functionBody)
                        return new FunctionDecl(text, functionBody);
                    else {
                        console.warn(`Error parsing FunctionBody in FunctionDecl`);
                        return null;
                    }
                }
                else {
                    console.warn(`Expecting ')' in FunctionDecl, while we got a ${text}`);
                    return null;
                }
            }
            else {
                console.warn(`Expecting '(' in FunctionDecl, while we got a ${text}`);
                return null;
            }
        }
        else
            return null;
    }
    /**
     * 解析Prog。语法规则：
     *
     * prog = (functionDecl | functionCall)*
     */
    parseProg() {
        let stmts = [];
        let stmt = null;
        let token = this.tokenizer.peek();
        while (token.kind !== TokenKind.EOF) {
            if (token.kind === TokenKind.Keyword && token.text === 'function') {
                stmt = this.parseFunctionDecl();
            }
            else if (token.kind === TokenKind.Identifier) {
                stmt = this.parseFunctionCall();
            }
            if (stmt) {
                stmts.push(stmt);
            }
            token = this.tokenizer.peek();
        }
        return new Prog(stmts);
    }
}
/** Ast遍历器 */
class AstVisitor {
    visitFunctionCall(fc) { }
    visitFunctionBody(fb) {
        let retVal;
        for (const x of fb.stmts) {
            retVal = this.visitFunctionCall(x);
        }
        return retVal;
    }
    visitFunctionDecl(fd) {
        return this.visitFunctionBody(fd.body);
    }
    visitProg(prog) {
        let retVal;
        for (const x of prog.stmts) {
            if (typeof x.body === 'object') {
                retVal = this.visitFunctionDecl(x);
            }
            else {
                retVal = this.visitFunctionCall(x);
            }
        }
        return retVal;
    }
}
/**
 * 语义分析
 */
/** 消解函数调用 */
class RefResolver extends AstVisitor {
    prog = null;
    visitProg(prog) {
        this.prog = prog;
        for (const x of prog.stmts) {
            const functionCall = x;
            if (typeof functionCall.parameters === 'object')
                this.resolveFunctionCall(prog, functionCall);
            else
                this.visitFunctionDecl(x);
        }
    }
    visitFunctionBody(functionBody) {
        if (this.prog !== null)
            for (const x of functionBody.stmts)
                this.resolveFunctionCall(this.prog, x);
    }
    resolveFunctionCall(prog, functionCall) {
        const functionDecl = this.findFunctionDecl(prog, functionCall.name);
        if (functionDecl !== null)
            functionCall.definition = functionDecl;
        else if (functionCall.name !== 'println') {
            console.error("Error: cannot find definition of function " + functionCall.name);
        }
    }
    findFunctionDecl(prog, name) {
        for (const x of prog.stmts) {
            const functionDecl = x;
            if (typeof functionDecl.body === 'object' && functionDecl.name === name)
                return functionDecl;
        }
        return null;
    }
}
/** 遍历ast，执行函数调用 */
class Interpretor extends AstVisitor {
    runFunction(functionCall) {
        if (functionCall.name === 'println') {
            if (functionCall.parameters.length > 0)
                console.log(...functionCall.parameters);
            return 0;
        }
        else if (functionCall.definition) {
            this.visitFunctionBody(functionCall.definition.body);
        }
    }
    visitFunctionBody(functionBody) {
        let retVal;
        for (let x of functionBody.stmts) {
            retVal = this.runFunction(x);
        }
        ;
        return retVal;
    }
    visitProg(prog) {
        let retVal;
        for (const x of prog.stmts) {
            const functionCall = x;
            if (typeof functionCall.parameters === 'object') {
                retVal = this.runFunction(functionCall);
            }
        }
        return retVal;
    }
}
function compileAndRun() {
    // 词法分析
    // const tokenizer = new Tokenizer(tokenArray)
    const tokenizer = new Tokenizer(new CharStream(charStream));
    // 语法分析
    const prog = new Parser(tokenizer).parseProg();
    console.log('\n语法分析后的AST');
    prog.dump('');
    // 语义分析
    new RefResolver().visitProg(prog);
    console.log("\n语义分析后的AST，注意自定义函数的调用已被消解:");
    prog.dump('');
    // 运行程序
    console.log(`运行结果是 ${new Interpretor().visitProg(prog)}`);
}
compileAndRun();
