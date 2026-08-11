import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function DateRangePicker({
  value,
  onChange,
  className,
}: {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  className?: string;
}) {
  const [internal, setInternal] = React.useState<DateRange | undefined>(value);
  const range = value ?? internal;

  const handle = (r: DateRange | undefined) => {
    setInternal(r);
    onChange?.(r);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[260px] justify-start text-left font-normal",
            !range?.from && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {range?.from ? (
            range.to ? (
              <>
                {format(range.from, "LLL d, yyyy")} – {format(range.to, "LLL d, yyyy")}
              </>
            ) : (
              format(range.from, "LLL d, yyyy")
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={range}
          onSelect={handle}
          numberOfMonths={2}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
