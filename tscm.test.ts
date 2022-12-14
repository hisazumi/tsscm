import { seval, intern, topLevel, sparser, peval } from "./tscm"

test("topLevel", () => {
    const f = topLevel.get(intern('+')) as Function;
    expect(f([10, 20])).toBe(30);
});

test("seval(+)", () => {
    expect(seval([intern('+'), 10, 20], topLevel)).toBe(30);
    expect(seval([intern('+'), 10, 20, [intern('+'), 20, 30]], topLevel)).toBe(80);
    expect(seval([intern('+'), 1 - 1], topLevel)).toBe(0);
});

test("parser", () => {
    expect(sparser("(+ \"1\")")).toEqual([intern("+"), "1"]);
    expect(sparser("(+ 1 2)")).toEqual([intern("+"), 1, 2]);
    expect(sparser("(+ (+ 1 2) 3 4)")).toEqual([intern("+"), [intern("+"), 1, 2], 3, 4]);
    expect(sparser("((lambda () 1))")).toEqual([[intern("lambda"), [], 1]]);
});

test("peval", () => {
    expect(peval("(+ 1 2)", topLevel)).toBe(3);
    expect(peval("(+ (+ 1 2) 3 4)", topLevel)).toBe(10);
    expect(peval("(+ 1 -1)", topLevel)).toBe(0);
});

test("lambda", () => {
    expect(peval("((lambda () 1))", topLevel)).toBe(1);
    expect(peval("((lambda () 1 2))", topLevel)).toBe(2);
    expect(peval("((lambda (x) x) 1)", topLevel)).toBe(1);
    expect(peval("((lambda (x) 2 x) 1)", topLevel)).toBe(1);
    expect(peval("((lambda (x) (+ x x)) 2)", topLevel)).toBe(4);
});

test("define", () => {
    peval("(define a 10)", topLevel)
    expect(peval("a", topLevel)).toBe(10);
    peval("(define 2times (lambda (x) (+ x x)))", topLevel);
    expect(peval("(2times 2)", topLevel)).toBe(4);
});

test("set!", () => {
    peval("(define x 1)", topLevel);
    peval("(set! x (+ x 1))", topLevel);
    expect(peval("x", topLevel)).toBe(2);
    peval("(set! x (+ x 1))", topLevel);
    expect(peval("x", topLevel)).toBe(3);
});

test("lambda env", () => {
    peval("(define counter ((lambda (x) (lambda () (set! x (+ x 1)) x)) 0))", topLevel);
    expect(peval("(counter)", topLevel)).toBe(1);
    expect(peval("(counter)", topLevel)).toBe(2);

});

test("if", () => {
    expect(peval("(if (= 1 1) 1 0)", topLevel)).toBe(1);
    expect(peval("(if (= 1 2) 1 0)", topLevel)).toBe(0);
    peval("(define x 10)", topLevel);
    expect(peval("(if (= x 10) 1 0)", topLevel)).toBe(1);
    expect(peval("(if (= x 9) 1 0)", topLevel)).toBe(0);
    expect(peval("(if (= x 10) (+ 1 2) (+ 3 4))", topLevel)).toBe(3);
    expect(peval("(if (= x 9) (+ 1 2) (+ 3 4))", topLevel)).toBe(7);

});

test("recursive", () => {
    peval("(define fact (lambda (x) (if (= x 1) 1 (* x (fact (+ x -1))))))", topLevel);
    expect(peval("(fact 2)", topLevel)).toBe(2);
});