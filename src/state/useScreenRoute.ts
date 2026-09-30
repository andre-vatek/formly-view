import { useEffect, useState } from "react";
import { toScreenId } from "../config/screens";
import { ScreenId } from "../types";

/** Current screen, synced with the URL hash (#05 … #08). */
export function useScreenRoute() {
  const [screen, setScreen] = useState<ScreenId>(
    toScreenId(location.hash.slice(1)),
  );
  useEffect(() => {
    const f = () => setScreen(toScreenId(location.hash.slice(1)));
    addEventListener("hashchange", f);
    return () => removeEventListener("hashchange", f);
  }, []);
  const go = (k: ScreenId) => {
    location.hash = k;
  };
  return [screen, go] as const;
}
