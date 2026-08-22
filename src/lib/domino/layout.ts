/**
 * تشكيل سلسلة الدومينو بشكل «ثعبان» مطابق للتصميم المرجعي:
 * - أبعاد وفواصل ثابتة لكل حجر
 * - الحجر المزدوج عمودي دائمًا، وغير المزدوج أفقي دائمًا
 * - أول حجر يبقى في مركز الساحة (الإحداثيات نسبية للمركز 0,0)
 * - عند زيادة الحجارة تُطوى السلسلة في صفوف متبادلة الاتجاه وتتوسع الساحة
 */

/** الطول الثابت للحجر (المحور الطويل) بالبكسل */
export const TILE_LONG = 56;
/** العرض الثابت للحجر (المحور القصير) بالبكسل */
export const TILE_SHORT = 28;
/** الفاصل الثابت بين الحجارة */
export const TILE_GAP = 4;
/** الفاصل الرأسي بين صفوف السلسلة */
export const ROW_GAP = 10;
/** ارتفاع الصف = أطول حجر ممكن (مزدوج عمودي) */
export const ROW_HEIGHT = TILE_LONG + ROW_GAP;

export type ChainTile = { id: string; left: number; right: number };

export type LayoutItem = {
  id: string;
  left: number;
  right: number;
  /** مزدوج ⇒ عمودي */
  double: boolean;
  /** إحداثي مركز الحجر بالنسبة لمركز الحجر الأول */
  x: number;
  y: number;
  /** درجة الدوران الثابتة (0 أفقي، 90 عمودي) */
  rotation: 0 | 90;
  row: number;
};

export type ChainLayout = {
  items: LayoutItem[];
  /** أبعاد صندوق السلسلة الكلي (تُستخدم لتوسيع الساحة) */
  width: number;
  height: number;
  rows: number;
};

function tileWidth(double: boolean): number {
  return double ? TILE_SHORT : TILE_LONG;
}

/**
 * @param tiles سلسلة الحجارة بترتيب اللوحة
 * @param maxWidth أقصى عرض متاح للساحة بالبكسل
 */
export function layoutChain(tiles: ChainTile[], maxWidth: number): ChainLayout {
  const usable = Math.max(TILE_LONG + TILE_GAP * 2, maxWidth);
  const items: LayoutItem[] = [];
  let row = 0;
  let cursor = 0; // مسافة من بداية الصف حتى الحافة اليسرى للحجر التالي
  const rowStarts: number[] = [];

  for (const tile of tiles) {
    const double = tile.left === tile.right;
    const w = tileWidth(double);
    if (cursor > 0 && cursor + w > usable) {
      row += 1;
      cursor = 0;
    }
    if (rowStarts[row] === undefined) rowStarts[row] = items.length;
    items.push({
      id: tile.id,
      left: tile.left,
      right: tile.right,
      double,
      rotation: double ? 90 : 0,
      x: cursor + w / 2,
      y: row * ROW_HEIGHT,
      row,
    });
    cursor += w + TILE_GAP;
  }

  // اتجاه الصفوف بالتبادل (ثعبان): الصفوف الفردية تُعكس أفقيًا
  const rows = row + 1;
  for (let r = 0; r < rows; r += 1) {
    const inRow = items.filter((it) => it.row === r);
    if (!inRow.length) continue;
    const rowMax = Math.max(...inRow.map((it) => it.x + tileWidth(it.double) / 2));
    if (r % 2 === 1) {
      for (const it of inRow) it.x = rowMax - it.x;
    }
  }

  // مركزة كل صف حول محور الساحة، ثم إزاحة الكل بحيث يكون الحجر الأول في المركز
  for (let r = 0; r < rows; r += 1) {
    const inRow = items.filter((it) => it.row === r);
    if (!inRow.length) continue;
    const min = Math.min(...inRow.map((it) => it.x - tileWidth(it.double) / 2));
    const max = Math.max(...inRow.map((it) => it.x + tileWidth(it.double) / 2));
    const center = (min + max) / 2;
    for (const it of inRow) it.x -= center;
  }

  const first = items[0];
  if (first) {
    const dx = first.x;
    const dy = first.y;
    for (const it of items) {
      it.x -= dx;
      it.y -= dy;
    }
  }

  const width = items.length
    ? Math.max(...items.map((it) => Math.abs(it.x) + tileWidth(it.double) / 2)) * 2
    : 0;
  const height = items.length
    ? Math.max(...items.map((it) => Math.abs(it.y) + TILE_LONG / 2)) * 2
    : 0;

  return { items, width, height, rows };
}

/** معامل التصغير المطلوب كي تبقى السلسلة كاملة داخل الساحة */
export function chainScale(layout: ChainLayout, viewWidth: number, viewHeight: number): number {
  if (!layout.items.length) return 1;
  const sx = viewWidth / Math.max(1, layout.width);
  const sy = viewHeight / Math.max(1, layout.height);
  return Math.max(0.45, Math.min(1, sx, sy));
}
