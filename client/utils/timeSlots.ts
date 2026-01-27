export const generateTimeSlots = (
  startStr: string = "09:00",
  endStr: string = "22:00",
  intervalMinutes: number = 15
): string[] => {
  const slots: string[] = [];
  
  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const startMinutes = timeToMinutes(startStr);
  let endMinutes = timeToMinutes(endStr);

  // If end is before start, it means it crosses midnight
  if (endMinutes < startMinutes) {
    endMinutes += 1440; // Add 24 hours in minutes
  }

  for (let minutes = startMinutes; minutes <= endMinutes; minutes += intervalMinutes) {
    const totalMinutes = minutes % 1440; // Wrap around 24 hours
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    
    const formattedHour = hour.toString().padStart(2, "0");
    const formattedMinute = minute.toString().padStart(2, "0");
    slots.push(`${formattedHour}:${formattedMinute}`);
    
    if (intervalMinutes <= 0) break;
  }
  
  return slots;
};

export const getStoreCurrentTimeMinutes = (): number => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Atlantic/Canary",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };
  const formatter = new Intl.DateTimeFormat("en-GB", options);
  const [h, m] = formatter.format(now).split(":").map(Number);
  return h * 60 + m;
};

export const getAvailableSlots = (allSlots: string[], prepBufferMinutes: number = 15): string[] => {
  const currentTotalMinutes = getStoreCurrentTimeMinutes();
  
  return allSlots.filter((slot) => {
    const [hourStr, minuteStr] = slot.split(":");
    let slotTotalMinutes = parseInt(hourStr) * 60 + parseInt(minuteStr);
    
    // If the slot is after midnight (e.g. 00:30) but current time is late night (e.g. 23:00)
    // we should treat the slot as being in the future (next day)
    if (slotTotalMinutes < 360 && currentTotalMinutes > 1080) { // 360 = 06:00, 1080 = 18:00
      slotTotalMinutes += 1440;
    }

    // Allow slots at least prepBufferMinutes from now for preparation buffer
    return slotTotalMinutes >= currentTotalMinutes + prepBufferMinutes;
  });
};

export const isShopOpen = (weeklySchedule?: any[]): boolean => {
  const currentTotalMinutes = getStoreCurrentTimeMinutes();
  
  let currentOpening = "";
  let currentClosing = "";
  let isEnabled = false;

  if (weeklySchedule && weeklySchedule.length > 0) {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Atlantic/Canary",
      weekday: "long"
    });
    const weekdayName = formatter.format(now);
    const dayMap: Record<string, number> = {
      "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6
    };
    const currentDay = dayMap[weekdayName];
    
    const todaySchedule = weeklySchedule.find((s: any) => s.day === currentDay);
    if (todaySchedule) {
      currentOpening = todaySchedule.open;
      currentClosing = todaySchedule.close;
      isEnabled = todaySchedule.enabled;
    }
  }

  if (!isEnabled || !currentOpening || !currentClosing) return false;

  const [startH, startM] = currentOpening.split(":").map(Number);
  const [endH, endM] = currentClosing.split(":").map(Number);
  
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;
  
  if (endTotal < startTotal) {
    // Overlaps midnight
    return currentTotalMinutes >= startTotal || currentTotalMinutes <= endTotal;
  }
  
  return currentTotalMinutes >= startTotal && currentTotalMinutes <= endTotal;
};
