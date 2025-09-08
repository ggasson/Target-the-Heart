import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/theme-context";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="button-theme-toggle">
          <i className="fas fa-sun h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"></i>
          <i className="fas fa-moon absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"></i>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")} data-testid="menu-theme-light">
          <i className="fas fa-sun mr-2"></i>
          Light
          {theme === "light" && <i className="fas fa-check ml-auto"></i>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} data-testid="menu-theme-dark">
          <i className="fas fa-moon mr-2"></i>
          Dark
          {theme === "dark" && <i className="fas fa-check ml-auto"></i>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} data-testid="menu-theme-system">
          <i className="fas fa-desktop mr-2"></i>
          System
          {theme === "system" && <i className="fas fa-check ml-auto"></i>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}