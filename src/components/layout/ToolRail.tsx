import { NAV } from "../../config/screens";
import { ScreenId } from "../../types";

type Props = { screen: ScreenId; go: (s: ScreenId) => void };

/** Vertical icon toolbar on the far left. */
export default function ToolRail({ screen, go }: Props) {
  return (
    <nav className="tools">
      {NAV.map(([n, k, d]) => (
        <button
          key={n}
          title={n}
          className={k === screen ? "on" : ""}
          onClick={() => k && go(k)}
        >
          <svg className="ic" viewBox="0 0 24 24">
            <path d={d} />
          </svg>
        </button>
      ))}
    </nav>
  );
}
