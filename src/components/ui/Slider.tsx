type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (n: number) => void;
  /** Called with true when a drag / key press starts and false when it ends,
   *  so the whole adjustment can be one undo step. */
  onGesture?: (active: boolean) => void;
};

export default function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
  onGesture,
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
        onPointerDown={() => {
          if (!onGesture) return;
          onGesture(true);
          // The release can happen outside the slider, so listen on the window.
          addEventListener("pointerup", () => onGesture(false), { once: true });
        }}
        onKeyDown={(e) => !e.repeat && onGesture?.(true)}
        onKeyUp={() => onGesture?.(false)}
        onBlur={() => onGesture?.(false)}
      />
    </div>
  );
}
