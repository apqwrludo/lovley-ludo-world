import { describe, expect, it } from "vitest";
import {
  COL_WIDTH,
  TILE_GAP,
  TILE_LONG,
  TILE_SHORT,
  chainScale,
  layoutChain,
  type ChainTile,
} from "./layout";

function chain(n: number): ChainTile[] {
  return Array.from({ length: n }, (_, i) => ({ id: `t${i}`, left: i % 7, right: (i + 1) % 7 }));
}

describe("تشكيل سلسلة الدومينو الرأسية", () => {
  it("يضع أول حجر في مركز الساحة تمامًا", () => {
    const { items } = layoutChain(chain(9), 420);
    expect(items[0]!.x).toBe(0);
    expect(items[0]!.y).toBe(0);
  });

  it("يثبت الاتجاهات: العادي عمودي والمزدوج أفقي", () => {
    const { items } = layoutChain(
      [
        { id: "d", left: 4, right: 4 },
        { id: "n", left: 4, right: 2 },
      ],
      420,
    );
    expect(items[0]!.rotation).toBe(90);
    expect(items[1]!.rotation).toBe(0);
  });

  it("يحفظ الفاصل الثابت بين حجرين متتاليين في نفس العمود", () => {
    const { items } = layoutChain(chain(2), 420);
    const gap = Math.abs(items[1]!.y - items[0]!.y) - TILE_LONG;
    expect(Math.round(gap)).toBe(TILE_GAP);
  });

  it("يطوي السلسلة في أعمدة متبادلة عند ضيق الارتفاع ويوسع العرض", () => {
    const { items, columns } = layoutChain(chain(8), TILE_LONG * 2 + TILE_GAP * 2);
    expect(columns).toBeGreaterThan(1);
    const c0 = items.filter((it) => it.column === 0);
    const c1 = items.filter((it) => it.column === 1);
    expect(Math.sign(c0[1]!.y - c0[0]!.y)).toBe(-Math.sign(c1[1]!.y - c1[0]!.y));
    expect(Math.abs(c1[0]!.x - c0[0]!.x)).toBe(COL_WIDTH);
  });

  it("يوسّع منطقة اللعب مع زيادة القطع", () => {
    const small = layoutChain(chain(4), 420);
    const big = layoutChain(chain(20), 420);
    expect(big.height).toBeGreaterThanOrEqual(small.height);
    expect(big.width).toBeGreaterThan(small.width);
  });

  it("يصغّر السلسلة بدل تضييق الحجارة على بعضها", () => {
    expect(chainScale(layoutChain(chain(24), 420), 320, 380)).toBeLessThan(1);
    expect(chainScale(layoutChain(chain(2), 420), 320, 380)).toBe(1);
    expect(TILE_SHORT).toBeLessThan(TILE_LONG);
  });
});
