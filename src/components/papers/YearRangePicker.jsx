import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export default function YearRangePicker({ yearFrom, yearTo, onYearFromChange, onYearToChange }) {
  const [fromDate, setFromDate] = useState(yearFrom ? new Date(yearFrom, 0, 1) : undefined);
  const [toDate, setToDate] = useState(yearTo ? new Date(yearTo, 0, 1) : undefined);

  const handleFromSelect = (date) => {
    if (date) {
      setFromDate(date);
      onYearFromChange(date.getFullYear().toString());
    }
  };

  const handleToSelect = (date) => {
    if (date) {
      setToDate(date);
      onYearToChange(date.getFullYear().toString());
    }
  };

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal h-10">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {fromDate ? fromDate.getFullYear() : "From year"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={fromDate}
            onSelect={handleFromSelect}
            defaultMonth={fromDate || new Date(2000, 0)}
            disabled={(date) => date > new Date() || date < new Date(1990, 0, 1)}
            captionLayout="dropdown-buttons"
            fromYear={1990}
            toYear={new Date().getFullYear()}
          />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal h-10">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {toDate ? toDate.getFullYear() : "To year"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={toDate}
            onSelect={handleToSelect}
            defaultMonth={toDate || new Date()}
            disabled={(date) => date > new Date() || date < new Date(1990, 0, 1)}
            captionLayout="dropdown-buttons"
            fromYear={1990}
            toYear={new Date().getFullYear()}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}