import { useEffect } from "react";
import { useStore } from "./store";
import { Intro } from "./screens/Intro";
import { CardScreen } from "./screens/Card";
import { Contrast } from "./screens/Contrast";
import { Stats } from "./screens/Stats";

export function App() {
  const screen = useStore((s) => s.screen);

  useEffect(() => {
    const onPop = () => useStore.getState().show("intro");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  switch (screen) {
    case "card":
      return <CardScreen />;
    case "contrast":
      return <Contrast />;
    case "stats":
      return <Stats />;
    default:
      return <Intro />;
  }
}
