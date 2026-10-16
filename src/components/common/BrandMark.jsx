// [INTERFAZ: MARCA] Dibuja el identificador visual de En Equipo.
import { Check } from 'lucide-react';
export default function BrandMark({ compact = false }) {
  return (
    <div className={`brand-mark${compact ? ' brand-mark--compact' : ''}`} aria-label="En Equipo">
      <span className="brand-mark__icon" aria-hidden="true">
        <Check size={19} strokeWidth={3} />
      </span>
      {!compact && (
        <span className="brand-mark__name">
          en equipo<span>.</span>
        </span>
      )}
    </div>
  );
}
