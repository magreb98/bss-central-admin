import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface DateRange {
  from: string;
  to: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  return (
    <div className={`flex flex-wrap items-end gap-3 ${className ?? ""}`}>
      <div className="space-y-1">
        <Label htmlFor="drp-from">Du</Label>
        <Input
          id="drp-from"
          type="date"
          value={value.from}
          max={value.to}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          className="w-40"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="drp-to">Au</Label>
        <Input
          id="drp-to"
          type="date"
          value={value.to}
          min={value.from}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          className="w-40"
        />
      </div>
    </div>
  );
}
