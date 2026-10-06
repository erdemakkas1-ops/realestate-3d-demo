import { useId, type CSSProperties } from "react";
import styles from "./PaymentSlider.module.css";

export default function PaymentSlider({ label, value, min, max, step, formatValue, onChange, compact = false }: {
  compact?: boolean;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatValue: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const progress = ((value - min) / (max - min)) * 100;
  return <div>
    <div className={`${compact ? "mb-1" : "mb-5"} flex items-center justify-between gap-2`}>
      <label htmlFor={id} className="text-sm text-[#aab5c4]">{label}</label>
      <output htmlFor={id} className={`${compact ? "text-sm" : "font-display text-2xl font-semibold"} whitespace-nowrap tabular-nums text-[#f1ebdf]`}>{formatValue(value)}</output>
    </div>
    <div className="flex min-h-11 items-center">
      <input id={id} type="range" min={min} max={max} step={step} value={value} aria-valuetext={formatValue(value)} onChange={event => onChange(Number(event.target.value))} className={styles.slider} style={{ "--slider-fill": `linear-gradient(to right, #d8b879 0%, #d8b879 ${progress}%, #202a38 ${progress}%, #202a38 100%)` } as CSSProperties} />
    </div>
    <div className="mt-1 flex justify-between font-mono text-[11px] text-[#7f8c9e]"><span>{formatValue(min)}</span><span>{formatValue(max)}</span></div>
  </div>;
}

