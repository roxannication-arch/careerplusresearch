import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-2xl border-2 border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition-all outline-none placeholder:text-slate-400 focus-visible:border-indigo-400 focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 aria-invalid:border-rose-400 aria-invalid:ring-4 aria-invalid:ring-rose-100",
        className
      )}
      {...props}
    />
  )
}

export { Input }
