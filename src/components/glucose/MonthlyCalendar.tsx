"use client";

import { useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import {
  GlucoseReading,
  GlucoseUnit,
  DEFAULT_GLUCOSE_TARGETS_MGDL,
  DEFAULT_GLUCOSE_TARGETS_MMOL,
  isInRange,
} from "@/src/types/glucose";

interface MonthlyCalendarProps {
  month: Date;
  readings: GlucoseReading[];
  unit: GlucoseUnit;
}

export default function MonthlyCalendar({
  month,
  readings,
  unit,
}: MonthlyCalendarProps) {
  const targets =
    unit === "mg/dL"
      ? DEFAULT_GLUCOSE_TARGETS_MGDL
      : DEFAULT_GLUCOSE_TARGETS_MMOL;

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const dayData = useMemo(() => {
    const data = new Map<
      string,
      {
        readings: GlucoseReading[];
        average: number;
        inRangePercentage: number;
      }
    >();

    readings.forEach((reading) => {
      const dayKey = format(reading.timestamp, "yyyy-MM-dd");

      if (!data.has(dayKey)) {
        data.set(dayKey, {
          readings: [],
          average: 0,
          inRangePercentage: 0,
        });
      }

      const dayInfo = data.get(dayKey)!;
      dayInfo.readings.push(reading);
    });

    // Calculate averages and in-range percentages
    data.forEach((dayInfo, dayKey) => {
      const values = dayInfo.readings.map((r) => r.value);
      dayInfo.average =
        values.reduce((sum, val) => sum + val, 0) / values.length;

      const inRangeCount = dayInfo.readings.filter((r) =>
        isInRange(r, targets),
      ).length;
      dayInfo.inRangePercentage =
        (inRangeCount / dayInfo.readings.length) * 100;
    });

    return data;
  }, [readings, targets]);

  const getDayColor = (day: Date) => {
    const dayKey = format(day, "yyyy-MM-dd");
    const data = dayData.get(dayKey);

    if (!data || data.readings.length === 0) {
      return "bg-white";
    }

    if (data.inRangePercentage >= 80) {
      return "bg-green-100";
    } else if (data.inRangePercentage >= 60) {
      return "bg-yellow-100";
    } else {
      return "bg-red-100";
    }
  };

  const formatAverage = (value: number) => {
    return unit === "mg/dL" ? Math.round(value) : value.toFixed(1);
  };

  return (
    <div>
      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-neutral-600 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const data = dayData.get(dayKey);
          const isCurrentMonth = day.getMonth() === month.getMonth();
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={dayKey}
              className={`
                relative p-2 min-h-[80px] rounded-lg border transition-colors
                ${isCurrentMonth ? getDayColor(day) : "bg-neutral-50"}
                ${isToday ? "border-primary-500 border-2" : "border-neutral-200"}
                ${data && data.readings.length > 0 ? "cursor-pointer hover:shadow-md" : ""}
              `}
            >
              <div
                className={`text-sm font-medium ${
                  isCurrentMonth ? "text-neutral-900" : "text-neutral-400"
                }`}
              >
                {format(day, "d")}
              </div>

              {isCurrentMonth && data && data.readings.length > 0 && (
                <div className="mt-1">
                  <div className="text-xs font-semibold">
                    {formatAverage(data.average)} {unit}
                  </div>
                  <div className="text-xs text-neutral-600">
                    {data.readings.length} reading
                    {data.readings.length > 1 ? "s" : ""}
                  </div>
                  <div className="text-xs font-medium mt-1">
                    {data.inRangePercentage.toFixed(0)}% in range
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 rounded border border-neutral-300"></div>
          <span>≥80% in range</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 rounded border border-neutral-300"></div>
          <span>60-79% in range</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 rounded border border-neutral-300"></div>
          <span>&lt;60% in range</span>
        </div>
      </div>
    </div>
  );
}
