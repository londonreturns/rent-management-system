"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export function NavBar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const isActive = (path: string) => {
    // Default to home if on root path
    if (pathname === "/" && path === "/home") return true;
    return pathname === path;
  };

  return (
    <div className="flex items-center justify-center w-full p-2 sm:p-4 border-b border-gray-200 bg-gray-50">
      <NavigationMenu viewport={false}>
        <NavigationMenuList className="flex flex-wrap justify-center gap-1 sm:gap-2">
          <NavigationMenuItem>
            <NavigationMenuLink
              asChild
              className={navigationMenuTriggerStyle()}
            >
              <Link
                href="/payment"
                className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 ${
                  isActive("/payment")
                    ? "bg-black text-white hover:bg-black hover:text-white focus:bg-black focus:text-white"
                    : ""
                }`}
              >
                Payment
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              asChild
              className={navigationMenuTriggerStyle()}
            >
              <Link
                href="/home"
                className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 ${
                  isActive("/home")
                    ? "bg-black text-white hover:bg-black hover:text-white focus:bg-black focus:text-white"
                    : ""
                }`}
              >
                Home
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              asChild
              className={navigationMenuTriggerStyle()}
            >
              <Link
                href="/room"
                className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 ${
                  isActive("/room")
                    ? "bg-black text-white hover:bg-black hover:text-white focus:bg-black focus:text-white"
                    : ""
                }`}
              >
                Room
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              asChild
              className={navigationMenuTriggerStyle()}
            >
              <Link
                href="/people"
                className={`text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 ${
                  isActive("/people")
                    ? "bg-black text-white hover:bg-black hover:text-white focus:bg-black focus:text-white"
                    : ""
                }`}
              >
                People
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem className="ml-2 sm:ml-4">
            <NavigationMenuLink
              asChild
              className={navigationMenuTriggerStyle()}
            >
              <button 
                onClick={logout}
                className="flex items-center justify-center hover:bg-gray-200 px-2 sm:px-3 py-1 sm:py-2 rounded-md"
                title="Logout"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
