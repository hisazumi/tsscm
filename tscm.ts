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

export const sparser = (str: string): Sobj => {
    const tokens = str.match(/[()]|[^\s()]+/g);
    if (tokens == null) {
        return "";
    }

    // トークンを処理する再帰関数
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

