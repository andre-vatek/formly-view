import { AxisLock } from "../../types";

type Props = {
  locks: AxisLock;
  onChange: (axis: 0 | 1 | 2, val: boolean) => void;
};

/** Row of X / Y / Z lock toggles shown under a transform field. */
export default function AxisLockRow({ locks, onChange }: Props) {
  return (
    <div className="row" style={{ gap: 6, margin: "2px 0 14px" }}>
      {(["X", "Y", "Z"] as const).map((ax, i) => (
        <button
          key={ax}
          className="btn"
          style={{
            padding: "3px 8px",
            fontSize: 10,
            background: locks[i] ? "rgba(251,191,36,.16)" : undefined,
            borderColor: locks[i] ? "var(--am)" : undefined,
            color: locks[i] ? "var(--am)" : "var(--dim)",
          }}
          title={(locks[i] ? "Unlock " : "Lock ") + ax}
          onClick={() => onChange(i as 0 | 1 | 2, !locks[i])}
        >
          {locks[i] ? "🔒" : "🔓"} {ax}
        </button>
      ))}
    </div>
  );
}
