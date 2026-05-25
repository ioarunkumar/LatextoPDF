import { GripVertical, GripHorizontal } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type GroupProps = ComponentProps<typeof Group> & {
  direction?: "horizontal" | "vertical";
};

const ResizablePanelGroup = ({ className, direction, orientation, ...props }: GroupProps) => {
  const o = orientation ?? direction ?? "horizontal";
  return (
    <Group
      orientation={o}
      className={cn(
        "flex h-full w-full",
        o === "vertical" && "flex-col",
        className,
      )}
      {...props}
    />
  );
};

const ResizablePanel = Panel;

type HandleProps = ComponentProps<typeof Separator> & {
  withHandle?: boolean;
  orientation?: "horizontal" | "vertical";
};

const ResizableHandle = ({ withHandle, className, orientation = "horizontal", ...props }: HandleProps) => {
  const isVertical = orientation === "vertical";
  return (
    <Separator
      className={cn(
        "relative z-20 flex shrink-0 items-center justify-center bg-border transition-colors hover:bg-primary/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        isVertical
          ? "h-1.5 w-full cursor-row-resize"
          : "h-full w-1.5 cursor-col-resize",
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-4 w-4 items-center justify-center rounded-sm border bg-border">
          {isVertical ? <GripHorizontal className="h-2.5 w-2.5" /> : <GripVertical className="h-2.5 w-2.5" />}
        </div>
      )}
    </Separator>
  );
};

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
