"use client";

export default function Footer() {
  return (
    <div className="flex md:flex-row flex-col items-center justify-between gap-3 text-center border-t border-border pt-4">
      <p className="text-xs text-muted-foreground">
        © {new Date().getFullYear()} Trip Wheels Super Admin &bull; Private Operations Console
      </p>

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>Restricted Access &bull; All Actions Audited</span>
      </div>
    </div>
  );
}
