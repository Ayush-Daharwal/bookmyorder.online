/**
 * Helper utility to validate whether a selected date and time string is in the past compared to local system clock.
 */

export function parseDateTime(dateStr, timeStr) {
  if (!dateStr) {
    dateStr = new Date().toISOString().split('T')[0];
  }

  // Handle ASAP time
  if (!timeStr || timeStr.toLowerCase().includes('asap') || timeStr.includes('Right Now')) {
    return new Date(); // Current time is valid
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return new Date();

  // Clean time string, e.g. "07:30 PM", "7:30 PM", "14:30", "⚡ ASAP (7:30 PM)"
  let cleanTime = timeStr.replace(/^[⚡\s]*/, '').trim();
  if (cleanTime.includes('(') && cleanTime.includes(')')) {
    const matchInside = cleanTime.match(/\(([^)]+)\)/);
    if (matchInside) cleanTime = matchInside[1].trim();
  }

  const timeMatch = cleanTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!timeMatch) {
    return new Date();
  }

  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const ampm = timeMatch[3] ? timeMatch[3].toUpperCase() : null;

  if (ampm) {
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function isPastDateTime(dateStr, timeStr) {
  if (!dateStr) return false;
  if (!timeStr || timeStr.toLowerCase().includes('asap') || timeStr.includes('Right Now')) {
    return false;
  }

  const now = new Date();
  const selectedDateObj = parseDateTime(dateStr, timeStr);

  // If selected date is strictly before today's date (ignoring time)
  const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const selectedDateOnly = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate());

  if (selectedDateOnly < todayDateOnly) {
    return true;
  }

  if (selectedDateOnly > todayDateOnly) {
    return false;
  }

  // Same day: check if selected time is earlier than current time (with 1-minute grace)
  const timeDifference = now.getTime() - selectedDateObj.getTime();
  return timeDifference > 60000; // Past if more than 1 minute ago
}

export function getNearestFutureSlot(now = new Date()) {
  const slots = [
    '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM'
  ];
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
  const nextSlot = slots.find((slot) => parseDateTime(todayString, slot) > now);

  if (nextSlot) return { date: todayString, time: nextSlot };

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    date: [
      tomorrow.getFullYear(),
      String(tomorrow.getMonth() + 1).padStart(2, '0'),
      String(tomorrow.getDate()).padStart(2, '0'),
    ].join('-'),
    time: slots[0],
  };
}

export function formatTimeSlot(timeStr) {
  if (!timeStr) return '07:30 PM';
  if (timeStr.includes('ASAP') || timeStr.includes('Right Now')) return timeStr;
  
  // Format to standard 12-hour AM/PM e.g. "07:30 PM"
  const dateObj = parseDateTime(new Date().toISOString().split('T')[0], timeStr);
  let hours = dateObj.getHours();
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}
