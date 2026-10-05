type Props = {
  axis: string;
  value: number;
  onChange: (n: number) => void;
  decimals?: number;
  step?: number;
  disabled?: boolean;
  /** Called with true on focus and false on blur / Enter, so everything typed
   *  into the field in one go can be one undo step. */
  onGesture?: (active: boolean) => void;
};

/** Number input with a colored axis badge (X / Y / Z). */
export default function NumberField({
  axis,
  value,
  onChange,
  decimals = 1,
  step = 1,
  disabled,
  onGesture,
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
        onFocus={() => onGesture?.(true)}
        onBlur={() => onGesture?.(false)}
        onKeyDown={(e) => e.key === "Enter" && onGesture?.(true)}
      />
    </label>
  );
}
