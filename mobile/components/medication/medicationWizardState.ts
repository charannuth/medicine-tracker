import {
  normalizeScheduleTimes,
  scheduleTimeToTwelveHour,
  todayLocalDate,
  type Meridiem,
} from '../../lib/dates';
import {
  isMedicationRouteId,
  type MedicationRouteId,
} from '../../lib/medicationForms';
import type { MedicationScheduleType } from '../../lib/medicationSchedule';
import {
  defaultInjectionStyle,
  parseInjectionFromMed,
  parseOralCount,
  type DosageWizardValues,
} from '../../lib/doseByRoute';
import type { Medication, MedicationTrackingSync } from '../../lib/types';

export const BASE_STEPS = [
  'name',
  'route',
  'form',
  'dates',
  'frequency',
  'dosage',
] as const;

export const TAIL_SCHEDULED = ['times', 'notes', 'tracking', 'notifications', 'safety'] as const;
export const TAIL_AS_NEEDED = ['notes', 'tracking', 'safety'] as const;

export type WizardStep =
  | (typeof BASE_STEPS)[number]
  | (typeof TAIL_SCHEDULED)[number]
  | (typeof TAIL_AS_NEEDED)[number];

export const STEP_TITLES: Record<WizardStep, string> = {
  name: 'Medication name',
  route: 'How do you take it?',
  form: 'What type is it?',
  dates: 'Schedule dates',
  frequency: 'How often?',
  dosage: 'Dose amount',
  times: 'Dose times',
  notes: 'Notes',
  tracking: 'Refill tracking',
  notifications: 'Reminders',
  safety: 'Safety review',
};

export type DoseTimeRow = {
  id: string;
  time12: string;
  period: Meridiem;
};

export function wizardStepsFor(scheduleType: MedicationScheduleType): WizardStep[] {
  if (scheduleType === 'as_needed') {
    return [...BASE_STEPS, ...TAIL_AS_NEEDED];
  }
  return [...BASE_STEPS, ...TAIL_SCHEDULED];
}

export function newDoseTimeRow(time24?: string): DoseTimeRow {
  const base = time24
    ? scheduleTimeToTwelveHour(time24)
    : { time12: '8:00', period: 'AM' as Meridiem };
  return {
    id: `dt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    time12: base.time12,
    period: base.period,
  };
}

export function buildDoseTimes(initial?: Medication | null): DoseTimeRow[] {
  const times = normalizeScheduleTimes(initial?.schedule_times ?? []);
  if (times.length > 0) {
    return times.map((t) => newDoseTimeRow(t));
  }
  return [newDoseTimeRow()];
}

export function buildDosageWizardState(
  initial: Medication | null | undefined,
  route: MedicationRouteId | null,
  scheduleType: MedicationScheduleType,
): DosageWizardValues {
  const form = initial?.medication_form ?? '';
  const base: DosageWizardValues = {
    route,
    form,
    scheduleType,
    oralCount: '1',
    doseMg: initial?.dose_mg ?? '',
    injectionStyle: defaultInjectionStyle(form),
    injectionAmount: '',
    injectionUnit: 'units',
    dermalDescription: '',
    otherDescription: '',
    maxDosesPerDay:
      initial?.max_doses_per_day != null ? String(initial.max_doses_per_day) : '',
    prnTypicalAmount: '',
    prnHintInput: '',
    prnAmountHints: [...(initial?.prn_amount_hints ?? [])],
    prnSymptomHintInput: '',
    prnSymptomHints: [...(initial?.prn_symptom_hints ?? [])],
  };

  if (!initial) return base;

  if (scheduleType === 'as_needed') {
    const hints = [...(initial.prn_amount_hints ?? [])];
    let typical = initial.dose_pills?.trim() ?? '';
    if (typical === 'Varies') typical = '';
    if (typical && hints.includes(typical)) {
      return { ...base, prnTypicalAmount: typical, prnAmountHints: hints.filter((h) => h !== typical) };
    }
    return { ...base, prnTypicalAmount: typical, prnAmountHints: hints };
  }

  const medRoute =
    route ??
    (initial.medication_route && isMedicationRouteId(initial.medication_route)
      ? initial.medication_route
      : null);

  if (medRoute === 'oral') {
    return { ...base, route: medRoute, oralCount: parseOralCount(initial.dose_pills) };
  }
  if (medRoute === 'dermal') {
    const desc = initial.dose_pills?.trim() ?? '';
    return {
      ...base,
      route: medRoute,
      dermalDescription: desc === 'Apply to skin' ? '' : desc,
    };
  }
  if (medRoute === 'injection') {
    const inj = parseInjectionFromMed(initial.dose_pills, initial.dose_mg, form);
    return { ...base, route: medRoute, ...inj, doseMg: initial.dose_mg ?? '' };
  }
  return { ...base, route: medRoute, otherDescription: initial.dose_pills?.trim() ?? '' };
}

export function buildFormState(
  initial?: Medication | null,
  defaultScheduleType: MedicationScheduleType = 'scheduled',
) {
  const route =
    initial?.medication_route && isMedicationRouteId(initial.medication_route)
      ? initial.medication_route
      : null;
  const scheduleType: MedicationScheduleType =
    initial?.schedule_type === 'as_needed' ? 'as_needed' : defaultScheduleType;

  if (initial) {
    return {
      name: initial.name,
      route,
      form: initial.medication_form ?? '',
      scheduleType,
      doseTimes: buildDoseTimes(initial),
      notes: initial.notes ?? '',
      trackPills: initial.pills_remaining != null,
      pillsRemaining:
        initial.pills_remaining != null ? String(initial.pills_remaining) : '',
      startDate: initial.start_date ?? todayLocalDate(),
      hasEndDate: Boolean(initial.end_date),
      endDate: initial.end_date ?? '',
      trackingSync:
        initial.tracking_sync === 'hrt' ? ('hrt' as MedicationTrackingSync) : 'none',
    };
  }

  return {
    name: '',
    route: null as MedicationRouteId | null,
    form: '',
    scheduleType,
    doseTimes: buildDoseTimes(),
    notes: '',
    trackPills: false,
    pillsRemaining: '',
    startDate: todayLocalDate(),
    hasEndDate: false,
    endDate: '',
    trackingSync: 'none' as MedicationTrackingSync,
  };
}
