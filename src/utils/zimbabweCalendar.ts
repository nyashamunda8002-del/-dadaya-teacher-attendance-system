/**
 * Zimbabwe National Calendar & MoPSE Academic Terms Utility
 * Official Public Holidays & School Term Enforcement for Dadaya High School
 */

export interface ZimbabwePublicHoliday {
  date: string; // YYYY-MM-DD
  name: string;
  observedDate?: string;
  description: string;
  greeting: string;
}

export interface SchoolTerm {
  term: string; // 'Term 1' | 'Term 2' | 'Term 3'
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  year: number;
  description: string;
}

/**
 * Calculates Easter Sunday for a given year using the Anonymous Gregorian algorithm
 */
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed (2=March, 3=April)
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

/**
 * Calculates the Second Monday of August (Heroes' Day)
 */
function getHeroesDay(year: number): Date {
  // August is month 7 (0-indexed)
  const firstAug = new Date(year, 7, 1);
  let dayOfWeek = firstAug.getDay(); // 0 is Sunday, 1 is Monday
  // Days to first Monday
  let daysToFirstMon = (8 - dayOfWeek) % 7;
  if (dayOfWeek === 1) daysToFirstMon = 0;
  // First Monday date:
  const firstMonDate = 1 + daysToFirstMon;
  // Second Monday date:
  const secondMonDate = firstMonDate + 7;
  return new Date(year, 7, secondMonDate);
}

/**
 * Generates official list of Zimbabwe Public Holidays for any given year
 */
export function getZimbabwePublicHolidays(year: number = new Date().getFullYear()): ZimbabwePublicHoliday[] {
  const holidays: ZimbabwePublicHoliday[] = [];

  const formatIso = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // 1. New Year's Day (Jan 1)
  const ny = new Date(year, 0, 1);
  holidays.push({
    date: formatIso(ny),
    name: "New Year's Day",
    description: 'National public holiday celebrating the start of the new year',
    greeting: `🎉 Happy New Year ${year}! Wishing all Dadaya High School educators and staff peace, prosperity, and academic excellence.`,
  });

  // 2. Robert Gabriel Mugabe National Youth Day (Feb 21)
  const youthDay = new Date(year, 1, 21);
  holidays.push({
    date: formatIso(youthDay),
    name: 'National Youth Day',
    description: 'Celebration of youth contributions and leadership across Zimbabwe',
    greeting: `🌟 Happy National Youth Day! Dadaya High School honors the vibrant potential and leadership of Zimbabwe's youth.`,
  });

  // 3. Easter Holidays (Good Friday, Easter Saturday, Easter Sunday, Easter Monday)
  const easterSunday = getEasterSunday(year);
  
  const goodFriday = new Date(easterSunday);
  goodFriday.setDate(easterSunday.getDate() - 2);
  holidays.push({
    date: formatIso(goodFriday),
    name: 'Good Friday',
    description: 'Christian holy day commemorating the crucifixion',
    greeting: '🕊️ Blessed Good Friday to all Dadaya High School staff and faculty. Have a peaceful and reflective holiday.',
  });

  const easterSaturday = new Date(easterSunday);
  easterSaturday.setDate(easterSunday.getDate() - 1);
  holidays.push({
    date: formatIso(easterSaturday),
    name: 'Easter Saturday',
    description: 'Holy Saturday holiday in Zimbabwe',
    greeting: '🕊️ Happy Easter Saturday to the Dadaya High School community.',
  });

  holidays.push({
    date: formatIso(easterSunday),
    name: 'Easter Sunday',
    description: 'Resurrection Sunday celebration',
    greeting: '✨ Happy Easter Sunday! May this joyous season bring renewal and blessings to you and your family.',
  });

  const easterMonday = new Date(easterSunday);
  easterMonday.setDate(easterSunday.getDate() + 1);
  holidays.push({
    date: formatIso(easterMonday),
    name: 'Easter Monday',
    description: 'National public holiday concluding Easter celebrations',
    greeting: '🌿 Happy Easter Monday! Wishing all teachers a restful holiday before school activities resume.',
  });

  // 4. Independence Day (April 18)
  const indDay = new Date(year, 3, 18);
  holidays.push({
    date: formatIso(indDay),
    name: 'Independence Day',
    description: 'National celebration of Zimbabwean sovereignty and freedom (18 April 1980)',
    greeting: `🇿🇼 Happy Independence Day, Zimbabwe! Dadaya High School proudly celebrates our nation's freedom, resilience, and unity.`,
  });

  // 5. Workers' Day / May Day (May 1)
  const workersDay = new Date(year, 4, 1);
  holidays.push({
    date: formatIso(workersDay),
    name: "Workers' Day",
    description: 'International Workers Day honoring the dedication of educators and workers',
    greeting: `🛠️ Happy Workers' Day! We salute the tireless commitment of Dadaya High School teachers shaping the leaders of tomorrow.`,
  });

  // 6. Africa Day (May 25)
  const africaDay = new Date(year, 5, 25);
  holidays.push({
    date: formatIso(africaDay),
    name: 'Africa Day',
    description: 'Commemoration of the founding of the Organisation of African Unity (AU)',
    greeting: `🌍 Happy Africa Day! Dadaya High School proudly celebrates African unity, culture, and educational advancement.`,
  });

  // 7. Heroes' Day (Second Monday of August)
  const heroesDay = getHeroesDay(year);
  holidays.push({
    date: formatIso(heroesDay),
    name: "Heroes' Day",
    description: 'National tribute honoring Zimbabwe’s liberation heroes and heroines',
    greeting: `🎖️ Happy Heroes' Day! Dadaya High School salutes the bravery, legacy, and sacrifice of Zimbabwe’s national heroes.`,
  });

  // 8. Defence Forces Day (Tuesday after Heroes' Day)
  const defenceDay = new Date(heroesDay);
  defenceDay.setDate(heroesDay.getDate() + 1);
  holidays.push({
    date: formatIso(defenceDay),
    name: 'Defence Forces Day',
    description: 'Honoring the Zimbabwe Defence Forces for safeguarding national peace and sovereignty',
    greeting: `🛡️ Happy Defence Forces Day! Best wishes to all Dadaya High School staff on this national holiday.`,
  });

  // 9. National Unity Day (December 22)
  const unityDay = new Date(year, 11, 22);
  holidays.push({
    date: formatIso(unityDay),
    name: 'National Unity Day',
    description: 'Commemorating the 1987 Unity Accord fostering national cohesion and peace',
    greeting: `🤝 Happy National Unity Day! Dadaya High School celebrates unity, peace, and harmony across our beloved nation.`,
  });

  // 10. Christmas Day (December 25)
  const xmas = new Date(year, 11, 25);
  holidays.push({
    date: formatIso(xmas),
    name: 'Christmas Day',
    description: 'Celebration of the nativity and holiday goodwill',
    greeting: `🎄 Merry Christmas to all Dadaya High School educators and families! Wishing you joy, love, and happiness.`,
  });

  // 11. Boxing Day (December 26)
  const boxingDay = new Date(year, 11, 26);
  holidays.push({
    date: formatIso(boxingDay),
    name: 'Boxing Day',
    description: 'Traditional holiday of fellowship and giving',
    greeting: `🎁 Happy Boxing Day! Enjoy a wonderful, restful time with family and loved ones.`,
  });

  // Handle Sunday observance rule (Public Holidays Act: If a holiday falls on Sunday, Monday is also observed)
  const extraObservances: ZimbabwePublicHoliday[] = [];
  for (const h of holidays) {
    const [hY, hM, hD] = h.date.split('-').map(Number);
    const d = new Date(hY, hM - 1, hD);
    if (d.getDay() === 0) { // Sunday
      const mondayObserved = new Date(d);
      mondayObserved.setDate(d.getDate() + 1);
      const obsDateStr = formatIso(mondayObserved);
      // Check if not already in list
      if (!holidays.some((existing) => existing.date === obsDateStr)) {
        extraObservances.push({
          date: obsDateStr,
          name: `${h.name} (Observed)`,
          description: `Public holiday observed in lieu of ${h.name} falling on a Sunday`,
          greeting: `🎉 Happy ${h.name} Public Holiday! Enjoy the official day of rest.`,
        });
      }
    }
  }

  return [...holidays, ...extraObservances].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Checks if a given date is an official Zimbabwe Public Holiday
 */
export function checkZimbabwePublicHoliday(date: Date = new Date()): {
  isHoliday: boolean;
  holiday?: ZimbabwePublicHoliday;
} {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const holidays = getZimbabwePublicHolidays(year);
  const found = holidays.find((h) => h.date === dateStr);

  if (found) {
    return { isHoliday: true, holiday: found };
  }

  return { isHoliday: false };
}

/**
 * Standard Zimbabwean Ministry of Primary & Secondary Education (MoPSE) School Terms
 */
export function getStandardSchoolTerms(year: number = new Date().getFullYear()): SchoolTerm[] {
  return [
    {
      term: 'Term 1',
      name: `Term 1 (${year})`,
      startDate: `${year}-01-13`,
      endDate: `${year}-04-10`,
      year,
      description: 'First Academic Term - Athletics, foundational syllabus coverage, and opening assessments.',
    },
    {
      term: 'Term 2',
      name: `Term 2 (${year})`,
      startDate: `${year}-05-12`,
      endDate: `${year}-08-07`,
      year,
      description: 'Second Academic Term - Mid-year examinations, winter sports, and syllabus progress audits.',
    },
    {
      term: 'Term 3',
      name: `Term 3 (${year})`,
      startDate: `${year}-09-08`,
      endDate: `${year}-12-04`,
      year,
      description: 'Third Academic Term - ZIMSEC / Cambridge national examinations and graduation ceremonies.',
    },
  ];
}

/**
 * Evaluates whether a date falls inside active school term dates
 */
export function checkSchoolTermStatus(
  date: Date = new Date(),
  customSettings?: {
    currentTerm?: string;
    termStartDate?: string;
    termEndDate?: string;
    academicYear?: string;
  }
): {
  inTerm: boolean;
  activeTerm?: SchoolTerm;
  statusMessage: string;
  termName: string;
} {
  const year = date.getFullYear();
  const dateStr = date.toISOString().split('T')[0];

  // If custom term dates are defined in SchoolSettings, prioritize them
  if (customSettings?.termStartDate && customSettings?.termEndDate) {
    const start = customSettings.termStartDate;
    const end = customSettings.termEndDate;
    const termLabel = customSettings.currentTerm || 'Term 1';

    if (dateStr >= start && dateStr <= end) {
      return {
        inTerm: true,
        activeTerm: {
          term: termLabel,
          name: `${termLabel} (${customSettings.academicYear || year})`,
          startDate: start,
          endDate: end,
          year,
          description: `Active school term: ${start} to ${end}`,
        },
        statusMessage: `Active Academic Session (${termLabel}: ${start} – ${end})`,
        termName: termLabel,
      };
    }
  }

  // Fallback to standard MoPSE Zimbabwe calendar terms
  const terms = getStandardSchoolTerms(year);
  for (const t of terms) {
    if (dateStr >= t.startDate && dateStr <= t.endDate) {
      return {
        inTerm: true,
        activeTerm: t,
        statusMessage: `Active School Session (${t.name})`,
        termName: t.term,
      };
    }
  }

  // Outside all active terms (School Vacation / Term Break)
  return {
    inTerm: false,
    statusMessage: `School Vacation / Holiday Period (Term session closed on ${dateStr})`,
    termName: 'School Holiday',
  };
}

/**
 * Comprehensive Validation: Determines if attendance clocking is permitted today
 */
export function evaluateAttendanceEligibility(
  date: Date = new Date(),
  customSettings?: {
    currentTerm?: string;
    termStartDate?: string;
    termEndDate?: string;
    academicYear?: string;
    allowWeekendClocking?: boolean;
  }
): {
  canClock: boolean;
  reason: string;
  statusType: 'allowed' | 'weekend' | 'public_holiday' | 'outside_term';
  details?: {
    holidayName?: string;
    greeting?: string;
    termName?: string;
    dayName: string;
  };
} {
  const day = date.getDay();
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

  // 1. Weekend check (Saturday=6, Sunday=0)
  const isWeekendDay = day === 0 || day === 6;
  const allowWeekend = customSettings?.allowWeekendClocking ?? true;

  if (isWeekendDay && !allowWeekend) {
    return {
      canClock: false,
      reason: `School is closed today (${dayName} - Weekend). Attendance is only recorded on school days (Monday to Friday).`,
      statusType: 'weekend',
      details: { dayName },
    };
  }

  // 2. Zimbabwe Public Holiday check
  const holidayCheck = checkZimbabwePublicHoliday(date);
  if (holidayCheck.isHoliday && holidayCheck.holiday) {
    return {
      canClock: false,
      reason: `Public Holiday: Today is ${holidayCheck.holiday.name}. In accordance with Zimbabwe National Calendar and MoPSE regulations, schools are closed and teachers do not clock.`,
      statusType: 'public_holiday',
      details: {
        holidayName: holidayCheck.holiday.name,
        greeting: holidayCheck.holiday.greeting,
        dayName,
      },
    };
  }

  // 3. School Term Dates check
  const termCheck = checkSchoolTermStatus(date, customSettings);
  if (!termCheck.inTerm) {
    return {
      canClock: false,
      reason: `School Holiday / Term Break: Today is outside official term dates. Recording and clocking is active only during stated school terms.`,
      statusType: 'outside_term',
      details: {
        termName: termCheck.termName,
        dayName,
      },
    };
  }

  // 4. Eligible to clock!
  return {
    canClock: true,
    reason: `Attendance clocking active for ${termCheck.termName} on ${dayName}.`,
    statusType: 'allowed',
    details: {
      termName: termCheck.termName,
      dayName,
    },
  };
}
