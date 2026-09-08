"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, defaultChecked, checked, onCheckedChange, disabled, ...props }, ref) => {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked || false);
    
    const isChecked = checked !== undefined ? checked : internalChecked;

    const toggle = () => {
      if (disabled) return;
      if (checked === undefined) {
        setInternalChecked(!internalChecked);
      }
      onCheckedChange?.(!isChecked);
    };

    return (
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        disabled={disabled}
        onClick={toggle}
        className={cn(
          "peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50",
          isChecked ? "bg-primary" : "bg-slate-200",
          className
        )}
      >
        <span
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
            isChecked ? "translate-x-5" : "translate-x-0"
          )}
        />
        {/* Hidden input for form submission if needed */}
        <input
          type="checkbox"
          checked={isChecked}
          className="hidden"
          onChange={() => {}} // handled by button
          ref={ref}
          {...props}
        />
      </button>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
