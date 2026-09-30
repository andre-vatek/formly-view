type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (n: number) => void;
};

export default function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
}: Props) {
  return (
    <div className="sl">
      <div className="row">
        <span className="mute">{label}</span>
        <span className="v">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      />
    </div>
  );
}
