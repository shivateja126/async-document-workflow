"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "../ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return (
    <Button
      variant="secondary"
      className="h-11 w-11 rounded-full p-0"
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <SunMedium size={18} /> : <MoonStar size={18} />}
    </Button>
  );
}
