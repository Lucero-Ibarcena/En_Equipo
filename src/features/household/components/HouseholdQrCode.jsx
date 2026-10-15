import { useMemo } from 'react';
import { createQrMatrix } from '../../../utils/qrCode.js';

export default function HouseholdQrCode({ value, label }) {
  const matrix = useMemo(() => {
    try { return createQrMatrix(value); } catch { return null; }
  }, [value]);
  const path = useMemo(() => matrix?.flatMap((row, y) => {
    const segments = [];
    let start = -1;
    for (let x = 0; x <= row.length; x += 1) {
      if (row[x] && start < 0) start = x;
      if ((!row[x] || x === row.length) && start >= 0) {
        segments.push(`M${start + 4} ${y + 4}h${x - start}v1h-${x - start}z`);
        start = -1;
      }
    }
    return segments;
  }).join(' ') || '', [matrix]);

  if (!matrix) return <span className="household-qr-error">El enlace es muy largo para este QR. Compartí el código corto.</span>;

  return (
    <svg className="household-qr" viewBox="0 0 49 49" role="img" aria-label={label} shapeRendering="crispEdges">
      <rect width="49" height="49" fill="#fff" />
      <path d={path} fill="#17211a" />
    </svg>
  );
}
