import { XYZ } from "../../types";
import NumberField from "./NumberField";

type Props = {
  label?: string;
  value: XYZ;
  onChange: (n: XYZ) => void;
  decimals?: number;
  step?: number;
  disabled?: boolean;
  onGesture?: (active: boolean) => void;
};

/** Three NumberFields (X, Y, Z) editing one vector. */
export default function Vec3Field({
  label,
  value,
  onChange,
  decimals = 1,
  step = 1,
  disabled,
  onGesture,
}: Props) {
  return (
    <>
      {label && (
        <div className="mute" style={{ margin: "0 0 6px" }}>
          {label}
        </div>
      )}
      <div className="g3">
        {(["X", "Y", "Z"] as const).map((a, i) => (
          <NumberField
            key={a}
            axis={a}
            value={value[i]}
            decimals={decimals}
            step={step}
            disabled={disabled}
            onGesture={onGesture}
            onChange={(n) =>
              onChange(value.map((c, j) => (j === i ? n : c)) as XYZ)
            }
          />
        ))}
      </div>
    </>
  );
}
