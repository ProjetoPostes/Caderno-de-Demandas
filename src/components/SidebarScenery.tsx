import { useTheme } from "next-themes";
import forestImage from "@/assets/floresta.jpg";

export function SidebarScenery() {
  const { resolvedTheme } = useTheme();
  if (resolvedTheme !== "floresta") return null;
  return (
    <div className="sidebar-scenery" aria-hidden="true">
      <img src={forestImage} alt="" className="h-full w-full object-cover object-center" />
    </div>
  );
}