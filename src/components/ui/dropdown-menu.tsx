import * as React from "react"
import { DropdownMenu } from "radix-ui"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const DropdownMenuRoot = DropdownMenu.Root
const DropdownMenuTrigger = DropdownMenu.Trigger
const DropdownMenuPortal = DropdownMenu.Portal

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenu.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenu.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DropdownMenuPortal>
    <DropdownMenu.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[10rem] rounded-lg border border-border bg-background p-1 shadow-lg",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className
      )}
      {...props}
    />
  </DropdownMenuPortal>
))
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenu.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenu.Item> & { active?: boolean }
>(({ className, active, children, ...props }, ref) => (
  <DropdownMenu.Item
    ref={ref}
    className={cn(
      "flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none",
      "text-foreground hover:bg-muted focus:bg-muted",
      className
    )}
    {...props}
  >
    {children}
    {active && <Check className="size-3.5 text-muted-foreground" />}
  </DropdownMenu.Item>
))
DropdownMenuItem.displayName = "DropdownMenuItem"

export { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem }
