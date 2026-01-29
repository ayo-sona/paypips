"use client";
import { useTheme } from "next-themes";
import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { Monitor, Moon, Sun } from "lucide-react";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const getIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-5 w-5" />;
      case "dark":
        return <Moon className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button isIconOnly variant="light">
          {getIcon()}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Theme selection"
        onAction={(key) => setTheme(key as string)}
      >
        <DropdownItem key="light" startContent={<Sun className="h-4 w-4" />}>
          Light
        </DropdownItem>
        <DropdownItem key="dark" startContent={<Moon className="h-4 w-4" />}>
          Dark
        </DropdownItem>
        <DropdownItem
          key="system"
          startContent={<Monitor className="h-4 w-4" />}
        >
          System
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
