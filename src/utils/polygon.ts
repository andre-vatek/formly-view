type P = { x: number; y: number };

/** Shoelace area of the closed polygon through the points. */
export const area = (a: P[]) =>
  Math.abs(
    a.reduce((s, p, i) => {
      const q = a[(i + 1) % a.length];
      return s + p.x * q.y - q.x * p.y;
    }, 0),
  ) / 2;

/** Perimeter of the closed polygon through the points. */
export const perimeter = (a: P[]) =>
  a.length < 2
    ? 0
    : a.reduce((s, p, i) => {
        const q = a[(i + 1) % a.length];
        return s + Math.hypot(q.x - p.x, q.y - p.y);
      }, 0);
