"use strict";
exports.__esModule = true;
exports.topLevel = exports.peval = exports.sparser = exports.seval = exports.intern = void 0;
var SSymbol = /** @class */ (function () {
    function SSymbol(name) {
        this.name = name;
    }
    return SSymbol;
}());
var SLambda = /** @class */ (function () {
    function SLambda(args, body, env) {
        this.args = args;
        this.body = body;
        this.env = env;
    }
    return SLambda;
}());
var SEnv = /** @class */ (function () {
    function SEnv(up) {
        if (up === void 0) { up = null; }
        this.env = new Map();
        this.up = up;
    }
    SEnv.prototype.get = function (symbol) {
        var o = this.env.get(symbol);
        if (o == undefined) {
            if (this.up == null) {
                throw new Error("symbol '".concat(symbol.name, "' not found"));
            }
            else {
                return this.up.get(symbol);
            }
        }
        else {
            return o;
        }
    };
    ;
    SEnv.prototype.set = function (symbol, obj) {
        this.env.set(symbol, obj);
    };
    return SEnv;
}());
var symbolTable = new Map();
var intern = function (sym) {
    var s = symbolTable.get(sym);
    if (s instanceof SSymbol) {
        return s;
    }
    else {
        var s_1 = new SSymbol(sym);
        symbolTable.set(sym, s_1);
        return s_1;
    }
};
exports.intern = intern;
var atomp = function (v) {
    var type = typeof v;
    return type === 'string' || type === 'number'
        || v instanceof Function || v instanceof SSymbol;
};
var specialForms = new Map();
specialForms.set((0, exports.intern)('lambda'), function (ls, env) {
    if (ls[1] instanceof Array) { // args
        var args = ls[1].map(function (v) {
            if (v instanceof SSymbol) {
                return v;
            }
            else {
                throw new Error('unexpected symbol');
            }
        });
        var body = ls.slice(2, ls.length);
        var newEnv = new SEnv(env);
        return new SLambda(args, body, newEnv);
    }
    else {
        throw new Error("unexpected arguments ".concat(ls[1]));
    }
});
specialForms.set((0, exports.intern)('define'), function (ls, env) {
    if (ls[1] instanceof SSymbol) {
        env.set(ls[1], (0, exports.seval)(ls[2], env));
        return 0;
    }
    else {
        throw new Error("illigal syntax ".concat(ls));
    }
});
specialForms.set((0, exports.intern)('if'), function (ls, env) {
    if (2 <= ls.length && ls.length <= 3) {
        throw new Error('illigal if');
    }
    if ((0, exports.seval)(ls[1], env) == true) {
        return (0, exports.seval)(ls[2], env);
    }
    else if (ls.length == 4) {
        return (0, exports.seval)(ls[3], env);
    }
    else {
        return -1;
    }
});
var seval = function (ls, env) {
    //    console.log(ls);
    var evalLambda = function (slambda, realargs) {
        if (realargs.length != slambda.args.length) {
            throw new Error("argument mismatch: geven ".concat(realargs, " expected ").concat(slambda.args));
        }
        var envwargs = new SEnv(slambda.env);
        for (var i = 0; i < realargs.length; i++) {
            envwargs.set(slambda.args[i], (0, exports.seval)(realargs[i], env));
        }
        return (0, exports.seval)(slambda.body, envwargs);
    };
    if (atomp(ls)) {
        if (ls instanceof SSymbol) {
            return env.get(ls);
        }
        else {
            return ls;
        }
    }
    else if (ls instanceof SLambda) {
        return (0, exports.seval)(ls.body, ls.env);
    }
    else if (ls instanceof Array) {
        if (ls[0] instanceof SSymbol) {
            var symbol = ls[0];
            var specialFromHandler = specialForms.get(symbol);
            if (specialFromHandler === undefined) {
                var first = (0, exports.seval)(ls[0], env);
                if (first instanceof Function) {
                    return first(ls.slice(1).map(function (v) { return (0, exports.seval)(v, env); }));
                }
                else if (first instanceof SLambda) {
                    return evalLambda(first, ls.slice(1));
                }
                else {
                    var result_1 = (0, exports.seval)(first, env);
                    ls.slice(1).forEach(function (v) { return result_1 = (0, exports.seval)(v, env); });
                    return result_1;
                }
            }
            else {
                return specialFromHandler(ls, env);
            }
        }
        else if (ls[0] instanceof Array) {
            var result = (0, exports.seval)(ls[0], env);
            if (result instanceof SLambda) {
                return evalLambda(result, ls.slice(1));
            }
            else {
                return result;
            }
        }
        else {
            return ls[0];
        }
    }
    else {
        throw new Error("cannot evaluate ".concat(ls));
    }
};
exports.seval = seval;
var sparser = function (str) {
    var tokens = str.match(/[()]|[^\s()]+/g);
    if (tokens == null) {
        return "";
    }
    var processToken = function (i) {
        var token = tokens[i];
        if (token === '(') {
            var list = [];
            i++;
            while (tokens[i] !== ')') {
                var _a = processToken(i), value = _a[0], index = _a[1];
                list.push(value);
                i = index;
            }
            return [list, i + 1];
        }
        else if (token === ')') {
            throw new Error('unexpected )');
        }
        else if (token[0] === "\"" && token[token.length - 1] === "\"") {
            // string
            return [token.slice(1, token.length - 1), i + 1];
        }
        else if (!isNaN(Number(token))) {
            // number
            return [Number(token), i + 1];
        }
        else {
            // symbol
            return [(0, exports.intern)(token), i + 1];
        }
    };
    return processToken(0)[0];
};
exports.sparser = sparser;
var peval = function (str, env) {
    return (0, exports.seval)((0, exports.sparser)(str), env);
};
exports.peval = peval;
//-------------------------------------------------------
// Environment
exports.topLevel = new SEnv();
exports.topLevel.set((0, exports.intern)('display'), function (ls) {
    console.log(ls);
});
exports.topLevel.set((0, exports.intern)('+'), function (ls) {
    return ls.reduce(function (acc, cur, index, array) {
        if (typeof acc === 'number' && typeof cur === 'number') {
            return acc + cur;
        }
        else {
            return acc;
        }
    });
});
exports.topLevel.set((0, exports.intern)('*'), function (ls) {
    return ls.reduce(function (acc, cur, index, array) {
        if (typeof acc === 'number' && typeof cur === 'number') {
            return acc * cur;
        }
        else {
            return acc;
        }
    });
});
exports.topLevel.set((0, exports.intern)('='), function (ls) {
    return ls.reduce(function (acc, cur, index, array) {
        return acc == cur;
    });
});
