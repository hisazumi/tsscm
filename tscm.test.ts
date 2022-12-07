import { seval, intern, topLevel, sparser, peval } from "./tscm"

test("topLevel", () => {
    const f = topLevel.get(intern('+')) as Function;
    expect(f([10, 20])).toBe(30);
});

test("seval(+)", () => {
    expect(seval([intern('+'), 10, 20], topLevel)).toBe(30);
    expect(seval([intern('+'), 10, 20, [intern('+'), 20, 30]], topLevel)).toBe(80);
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
});

test("lambda", () => {
    expect(peval("((lambda () 1))", topLevel)).toBe(1);
    expect(peval("((lambda (x) x) 1)", topLevel)).toBe(1);
    
});