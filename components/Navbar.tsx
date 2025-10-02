"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export function NavBar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    // Default to home if on root path
    if (pathname === "/" && path === "/home") return true;
    return pathname === path;
  };

  return (
    <div className="flex items-center justify-center w-full p-4 border-b border-gray-200 bg-gray-50">
      <NavigationMenu viewport={false}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink
              asChild
              className={navigationMenuTriggerStyle()}
            >
              <Link
                href="/payment"
                className={
                  isActive("/payment")
                    ? "bg-black text-white hover:bg-black hover:text-white focus:bg-black focus:text-white"
                    : ""
                }
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
                className={
                  isActive("/home")
                    ? "bg-black text-white hover:bg-black hover:text-white focus:bg-black focus:text-white"
                    : ""
                }
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
                className={
                  isActive("/room")
                    ? "bg-black text-white hover:bg-black hover:text-white focus:bg-black focus:text-white"
                    : ""
                }
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
                className={
                  isActive("/people")
                    ? "bg-black text-white hover:bg-black hover:text-white focus:bg-black focus:text-white"
                    : ""
                }
              >
                People
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem className="ml-4">
            <NavigationMenuLink
              asChild
              className={navigationMenuTriggerStyle()}
            >
              <Link href="/" className="flex items-center justify-center">
                <X className="h-4 w-4 font-bold" />
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
