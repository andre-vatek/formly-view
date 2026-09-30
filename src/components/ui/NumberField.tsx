type Props = {
  axis: string;
  value: number;
  onChange: (n: number) => void;
  decimals?: number;
  step?: number;
  disabled?: boolean;
};

/** Number input with a colored axis badge (X / Y / Z). */
export default function NumberField({
  axis,
  value,
  onChange,
  decimals = 1,
  step = 1,
  disabled,
}: Props) {
  return (
    <label className="field">
      <b className={axis.toLowerCase()}>{axis}</b>
      <input
        type="number"
        step={step}
        value={+value.toFixed(decimals)}
        disabled={disabled}
        onChange={(e) => onChange(+e.target.value)}
      />
    </label>
  );
}
