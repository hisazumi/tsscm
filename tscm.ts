class SSymbol {
    constructor(name: string) {
        this.name = name;
    }
    name: string;
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

type Atom = string | number | Function | SSymbol;
type Slist = Array<Atom | Slist>;
type Sobj = Atom | Slist;

const atomp = (v: Sobj): boolean => {
    const type = typeof v;
    return type === 'string' || type === 'number'
        || v instanceof Function || v instanceof SSymbol;
}

export const seval = (ls: Sobj, env: Map<SSymbol, Sobj>): Sobj => {
    //    console.log(ls);
    if (atomp(ls)) {
        if (ls instanceof SSymbol) {
            const o = env.get(ls);
            if (o === undefined) {
                // error
                console.log('symbol {ls} not found');
                return ls;
            } else {
                return o;
            }
        } else {
            return ls;
        }
    } else if (ls instanceof Array && ls[0] instanceof SSymbol) {
        const evaledls = ls.map((v) => seval(v, env));
        if (evaledls[0] instanceof Function) {
            return evaledls[0](evaledls.slice(1));
        } else {
            // error
            return evaledls;
        }
    } else {
        return [];
    }
};

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

export const disp = () => {
    console.log("hoge");
}

const f = topLevel.get(intern('+')) as Function;
console.log(f([10, 20]));
// (display (+ 10 20))
console.log(seval([intern('+'), 10, 20], topLevel));
console.log(seval([intern('+'), 10, 20, [intern('+'), 20, 30]], topLevel));
