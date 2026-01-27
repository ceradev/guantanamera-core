import React, { useEffect, useState, useRef } from "react";
import { generateTimeSlots, getStoreCurrentTimeMinutes } from "../../../../utils/timeSlots";
import { Button } from "@/components/ui/buttons/button";
import { ScrollArea } from "@/components/ui/layout/scroll-area";
import { Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeSlotSelectorProps {
  onSelect: (time: string) => void;
  selectedTime: string;
  openingTime?: string;
  closingTime?: string;
  prepTime?: number;
}

export const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  onSelect,
  selectedTime,
  openingTime = "",
  closingTime = "",
  prepTime = 15,
}) => {
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!openingTime || !closingTime) {
      setAvailableSlots([]);
      return;
    }
    const allSlots = generateTimeSlots(openingTime, closingTime);

    // Filter out past slots based on current store time and prep time
    const currentTotalMinutes = getStoreCurrentTimeMinutes();

    const futureSlots = allSlots.filter(slot => {
      const [h, m] = slot.split(':').map(Number);
      return (h * 60 + m) >= (currentTotalMinutes + prepTime);
    });

    setAvailableSlots(futureSlots);

    if (!selectedTime && futureSlots.length > 0) {
      onSelect(futureSlots[0]);
    }
  }, [openingTime, closingTime, prepTime]);

  // Auto-scroll to selected time when it changes or on mount
  useEffect(() => {
    if (selectedButtonRef.current) {
      selectedButtonRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedTime, availableSlots]);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Quick Actions Header */}
      <div className="flex gap-4 shrink-0">
        <Button
          variant="secondary"
          size="lg"
          className="flex-1 h-14 text-lg font-semibold shadow-sm border-2 border-transparent hover:border-primary/20 active:scale-[0.98] transition-all"
          onClick={() => {
            if (availableSlots.length > 0) {
              onSelect(availableSlots[0]);
            }
          }}
        >
          <Clock className="w-5 h-5 mr-2 text-primary" />
          Ahora (Siguiente: {availableSlots[0] || "--:--"})
        </Button>
      </div>

      {/* Mobile: Horizontal Scroll */}
      <div className="lg:hidden w-full overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        <div className="flex gap-3 w-max">
          {availableSlots.length === 0 ? (
            <div className="w-full text-center py-4 text-muted-foreground">
              No hay horarios disponibles para hoy
            </div>
          ) : (
            availableSlots.map((slot) => {
              const isSelected = selectedTime === slot;
              return (
                <Button
                  key={slot}
                  ref={isSelected ? selectedButtonRef : null}
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => onSelect(slot)}
                  className={cn(
                    "h-12 px-6 text-lg font-bold rounded-xl transition-all duration-200 relative overflow-hidden shrink-0",
                    "active:scale-[0.98]",
                    isSelected
                      ? "bg-primary text-white shadow-md ring-2 ring-primary/20 border-primary"
                      : "bg-white text-gray-700 border hover:border-primary/50 hover:bg-primary/5"
                  )}
                >
                  {slot}
                  {isSelected && (
                    <div className="absolute top-1 right-1">
                      <Check className="w-3 h-3 text-white/80" />
                    </div>
                  )}
                </Button>
              );
            })
          )}
        </div>
      </div>

      {/* Desktop: Grid with ScrollArea */}
      <ScrollArea className="hidden lg:flex flex-1 rounded-2xl border bg-gray-50/50 p-4" ref={scrollRef}>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 pb-4">
          {availableSlots.length === 0 ? (
            <div className="col-span-full text-center py-10 text-muted-foreground">
              No hay horarios disponibles para hoy
            </div>
          ) : (
            availableSlots.map((slot) => {
              const isSelected = selectedTime === slot;
              return (
                <Button
                  key={slot}
                  ref={isSelected ? selectedButtonRef : null}
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => onSelect(slot)}
                  className={cn(
                    "h-14 text-lg font-bold rounded-xl transition-all duration-200 relative overflow-hidden",
                    "hover:scale-[1.02] active:scale-[0.98]",
                    isSelected
                      ? "bg-primary text-white shadow-md ring-2 ring-primary/20 border-primary"
                      : "bg-white text-gray-700 border hover:border-primary/50 hover:bg-primary/5"
                  )}
                >
                  {slot}
                  {isSelected && (
                    <div className="absolute top-1 right-1">
                      <Check className="w-3 h-3 text-white/80" />
                    </div>
                  )}
                </Button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
