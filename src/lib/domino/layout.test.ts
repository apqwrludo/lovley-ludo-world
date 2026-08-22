import { describe, expect, it } from "vitest";
import {
  ROW_HEIGHT,
  TILE_GAP,
  TILE_LONG,
  TILE_SHORT,
  chainScale,
  layoutChain,
  type ChainTile,
} from "./layout";

function chain(n: number, doubleEvery = 0): ChainTile[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `t${i}`,
    left: i,
    right: doubleEvery && i % doubleEvery === 0 ? i : i + 1,
  }));
}

describe("تشكيل سلسلة الدومينو", () => {
  it("يضع أول حجر في مركز الساحة تمامًا", () => {
    const { items } = layoutChain(chain(9), 320);
    expect(items[0]!.x).toBe(0);
    expect(items[0]!.y).toBe(0);
  });

  it("يثبت الأبعاد والاتجاه: المزدوج عمودي وغيره أفقي", () => {
    const { items } = layoutChain([{ id: "d", left: 4, right: 4 }, { id: "n", left: 4, right: 2 }], 400);
    expect(items[0]!.double).toBe(true);
    expect(items[0]!.rotation).toBe(90);
    expect(items[1]!.rotation).toBe(0);
  });

  it("يحفظ الفاصل الثابت بين حجرين متتاليين في نفس الصف", () => {
    const { items } = layoutChain(chain(2), 400);
    const gap =
      Math.abs(items[1]!.x - items[0]!.x) - (TILE_LONG / 2 + TILE_LONG / 2);
    expect(Math.round(gap)).toBe(TILE_GAP);
  });

  it("يطوي السلسلة في صفوف متبادلة الاتجاه عند ضيق العرض", () => {
    const { items, rows } = layoutChain(chain(8), TILE_LONG * 2 + TILE_GAP * 2);
    expect(rows).toBeGreaterThan(1);
    expect(items.some((it) => it.row === 1)).toBe(true);
    const r0 = items.filter((it) => it.row === 0);
    const r1 = items.filter((it) => it.row === 1);
    // الصف الثاني معكوس الاتجاه (ثعبان)
    expect(Math.sign(r0[1]!.x - r0[0]!.x)).toBe(-Math.sign(r1[1]!.x - r1[0]!.x));
    expect(r1[0]!.y - r0[0]!.y).toBe(ROW_HEIGHT);
  });

  it("يوسّع منطقة اللعب مع زيادة القطع", () => {
    const small = layoutChain(chain(4), 300);
    const big = layoutChain(chain(20), 300);
    expect(big.height).toBeGreaterThan(small.height);
    expect(big.rows).toBeGreaterThan(small.rows);
  });

  it("يصغّر السلسلة بدل تضييق الحجارة على بعضها", () => {
    const layout = layoutChain(chain(24), 320);
    expect(chainScale(layout, 320, 260)).toBeLessThan(1);
    expect(chainScale(layoutChain(chain(2), 320), 320, 260)).toBe(1);
    expect(TILE_SHORT).toBeLessThan(TILE_LONG);
  });
});
