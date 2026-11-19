"use client";

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { profileDD } from "@/app/(dashboard-layout)/layout/shared/header/data";
import { cn } from "@/lib/utils";
import { Shield, X, LogOut } from "lucide-react";

export default function ProfileSheet() {
  const handleSignOut = () => {
    window.location.href = "/api/v1/auth/logout";
  };

  return (
    <Sheet>
      {/* Trigger Button */}
      <SheetTrigger className="cursor-pointer hover:bg-primary/5 flex items-center justify-center rounded-full h-10 w-10">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
            SA
          </AvatarFallback>
        </Avatar>
      </SheetTrigger>

      {/* Drawer Panel */}
      <SheetContent
        showCloseButton={false}
        side="right"
        className="border-s-0 w-full sm:max-w-80 max-w-60"
      >
        <SheetClose className="absolute top-5 end-5 p-2 hover:bg-primary/5 hover:text-primary rounded-full cursor-pointer">
          <X width={18} height={18} />
        </SheetClose>

        {/* Top Profile Section */}
        <div className="p-6 py-6">
          <div className="flex flex-col gap-3 justify-center items-center pt-8">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                SA
              </AvatarFallback>
            </Avatar>

            <div className="text-center">
              <h6 className="text-base font-semibold">Super Administrator</h6>
              <div className="flex items-center gap-1.5 justify-center mt-1">
                <Shield size={14} className="text-emerald-600" />
                <span className="text-xs text-muted-foreground">
                  Operations & Moderation Team
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu List */}
        <div className="border-t border-dashed border-border">
          <ul className="flex flex-col gap-1 p-4">
            {profileDD.map((item) => (
              <li key={item.title}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 py-2.5 px-3 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                  )}
                >
                  <item.avatar width={18} height={18} className="shrink-0" />
                  <span className="text-sm font-medium">{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer with Sign Out */}
        <SheetFooter className="px-4 pb-6 mt-auto">
          <div className="w-full pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 cursor-pointer text-destructive hover:text-destructive"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
