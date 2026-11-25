import { useTheme } from "next-themes";
import forestAsset from "@/assets/floresta.jpg.asset.json";

export function SidebarScenery() {
  const { resolvedTheme } = useTheme();
  if (resolvedTheme !== "floresta") return null;
  return (
    <div className="sidebar-scenery" aria-hidden="true">
      <img src={forestAsset.url} alt="" className="h-full w-full object-cover object-center" />
    </div>
  );
}