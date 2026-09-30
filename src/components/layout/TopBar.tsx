import { DOC_TITLE } from "../../config/document";
import { ScreenMeta, TABS } from "../../config/screens";
import { ScreenId } from "../../types";

type Props = { meta: ScreenMeta; edited: boolean; go: (s: ScreenId) => void };

export default function TopBar({ meta, edited, go }: Props) {
  return (
    <header className="top">
      <span className="logo">F</span>
      <span className="menu">File Edit View Object Help</span>
      <span className="title">
        {DOC_TITLE}
        {edited ? " · Edited" : ""}
      </span>
      <div className="seg">
        {TABS.map(([t, k], i) => (
          <button
            key={k}
            className={meta.tab === i ? "on" : ""}
            onClick={() => go(k)}
          >
            {t}
          </button>
        ))}
      </div>
      <button className="btn">Share</button>
      <button className="btn pri">Export</button>
    </header>
  );
}
