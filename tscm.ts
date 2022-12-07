class SSymbol {
    constructor(name: string) {
        this.name = name;
    }
    name: string;
}

class SLambda {
    constructor(args: Array<SSymbol>, body: Array<Sobj>, env: SEnv) {
        this.args = args;
        this.body = body;
        this.env = env;
    }
    args: Array<SSymbol>;
    body: Array<Sobj>;
    env: SEnv;
}

const symbolTable = new Map<string, SSymbol>();
export const intern = (sym: string): SSymbol => {
    const s = symbolTable.get(sym);
    if (s instanceof SSymbol) {
        return s;
    } else {
        const s = new SSymbol(sym);
        symbolTable.set(sym, s);
        return s;
    }
}

export type Atom = string | number | Function | SSymbol | SLambda;
export type Slist = Array<Atom | Slist>;
export type Sobj = Atom | Slist;
export type SEnv = Map<SSymbol, Sobj>;

const atomp = (v: Sobj): boolean => {
    const type = typeof v;
    return type === 'string' || type === 'number'
        || v instanceof Function || v instanceof SSymbol;
}

export const seval = (ls: Sobj, env: SEnv): Sobj => {
//    console.log(ls);
    const lookupSymbol = (symbol: SSymbol): Sobj => {
        const o = env.get(symbol);
        if (o == undefined) {
            throw new Error(`symbol ${ls} not found`);
        } else {
            return o;
        }
    }

    const buildLambda = (ls: Array<Sobj>): SLambda => {
        if (ls[1] instanceof Array) { // args 
            const args = ls[1].map(v => {
                if (v instanceof SSymbol) {
                    return v;
                } else {
                    throw new Error('unexpected symbol');
                }
            });
            const body = ls.slice(2, ls.length);
            const newEnv = new Map(env);
            return new SLambda(args, body, newEnv);
        } else {
            throw new Error(`unexpected arguments ${ls[1]}`)
        }
    }

    if (atomp(ls)) {
        if (ls instanceof SSymbol) {
            return lookupSymbol(ls);
        } else {
            return ls;
        }
    } else if (ls instanceof SLambda) {
        return seval(ls.body, ls.env);
    } else if (ls instanceof Array) {
        if (ls[0] instanceof SSymbol) {
            const symbol = ls[0];
            if (symbol === intern('lambda')) {
                return buildLambda(ls);
            } else {
                const first = seval(ls[0], env);

                if (first instanceof Function) {
                    return first(ls.slice(1).map((v) => seval(v, env)));
                } else {
                    let result = seval(first, env);
                    ls.slice(1).forEach((v) => result = seval(v, env));
                    return result;
                }
            }
        } else if (ls[0] instanceof Array) {
            const result = seval(ls[0], env);
            if (result instanceof SLambda) {
                const args = ls.slice(1, ls.length);
                if (args.length != result.args.length) {
                    throw new Error("argument mismatch");
                }

                const envwargs = new Map(result.env);
                for (let i = 0; i < args.length; i++) {
                    envwargs.set(result.args[i], seval(args[i], env));
                }

                return seval(result.body, envwargs);
            } else {
                return result;
            }
        } else {
            return ls[0];
        }
    } else {
        throw new Error(`cannot evaluate ${ls}`);
    }
};

export const sparser = (str: string): Sobj => {
    const tokens = str.match(/[()]|[^\s()]+/g);
    if (tokens == null) {
        return "";
    }

    const processToken = (i: number): [Sobj, number] => {
        const token = tokens[i];
        if (token === '(') {
            const list = [];
            i++;
            while (tokens[i] !== ')') {
                const [value, index] = processToken(i);
                list.push(value);
                i = index;
            }
            return [list, i + 1];
        } else if (token === ')') {
            throw new Error('unexpected )');
        } else if (token[0] === "\"" && token[token.length - 1] === "\"") {
            // string
            return [token.slice(1, token.length - 1), i + 1];
        } else if (!isNaN(Number(token))) {
            // number
            return [Number(token), i + 1];
        } else {
            // symbol
            return [intern(token), i + 1];
        }
    };

    return processToken(0)[0];
};

export const peval = (str: string, env: SEnv): Sobj => {
    return seval(sparser(str), env);
}

//-------------------------------------------------------
// Environment
export const topLevel = new Map<SSymbol, Sobj>();

topLevel.set(intern('display'), (ls: Slist) => {
    console.log(ls);
});

topLevel.set(intern('+'), (ls: Slist) => {
    return ls.reduce((acc, cur, index, array) => {
        if (typeof acc === 'number' && typeof cur === 'number') {
            return acc + cur;
        } else {
            return acc;
        }
    });
});

console.log(peval("((lambda (x) x) 1)", topLevel))