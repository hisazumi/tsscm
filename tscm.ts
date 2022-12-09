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

const specialForms = new Map<SSymbol, Function>();
specialForms.set(intern('lambda'), (ls : Array<Sobj>, env : SEnv):Sobj => {
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
});

specialForms.set(intern('define'), (ls:Array<Sobj>, env:SEnv):Sobj => {
    if (ls[1] instanceof SSymbol) {
        const slambda = seval(ls[2], env);
        env.set(ls[1], slambda);
        return 0;
    }else{
        throw new Error(`illigal syntax ${ls}`)
    }
});

export const seval = (ls: Sobj, env: SEnv): Sobj => {
//    console.log(ls);
    const lookupSymbol = (symbol: SSymbol): Sobj => {
        const o = env.get(symbol);
        if (o == undefined) {
            throw new Error(`symbol '${symbol.name}' not found`);
        } else {
            return o;
        }
    }

    const evalLambda = (slambda : SLambda, realargs:Array<Sobj>) => {
        if (realargs.length != slambda.args.length) {
            throw new Error(`argument mismatch: geven ${realargs} expected ${slambda.args}`);
        }

        const envwargs = new Map(slambda.env);
        for (let i = 0; i < realargs.length; i++) {
            envwargs.set(slambda.args[i], seval(realargs[i], env));
        }

        return seval(slambda.body, envwargs);
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
            
            const specialFromHandler = specialForms.get(symbol);
            if (specialFromHandler === undefined) {
                const first = seval(ls[0], env);

                if (first instanceof Function) {
                    return first(ls.slice(1).map((v) => seval(v, env)));
                } else if (first instanceof SLambda) {
                    return evalLambda(first, ls.slice(1));
                } else {
                    let result = seval(first, env);
                    ls.slice(1).forEach((v) => result = seval(v, env));
                    return result;
                }
            }else{
                return specialFromHandler(ls, env);
            }
        } else if (ls[0] instanceof Array) {
            const result = seval(ls[0], env);
            if (result instanceof SLambda) {
                return evalLambda(result, ls.slice(1));
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