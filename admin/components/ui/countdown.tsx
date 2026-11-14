"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/format";

export interface CountdownProps {
  deadline: string | Date;
  className?: string;
}

export function Countdown({ deadline, className }: CountdownProps) {
  const [text, setText] = useState(() => formatCountdown(deadline));

  useEffect(() => {
    const updateCountdown = () => {
      setText(formatCountdown(deadline));
    };

    const interval = setInterval(updateCountdown, 15000);
    return () => clearInterval(interval);
  }, [deadline]);

  return <span className={className}>{text}</span>;
}
