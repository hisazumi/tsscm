import { seval, intern, topLevel } from "./tscm"

test("topLevel", () => {
    const f = topLevel.get(intern('+')) as Function;
    expect(f([10, 20])).toBe(30);
});

test("seval(+)", () => {
    expect(seval([intern('+'), 10, 20], topLevel)).toBe(30);
    expect(seval([intern('+'), 10, 20, [intern('+'), 20, 30]], topLevel)).toBe(80);
});