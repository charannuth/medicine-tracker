export type MedicationRouteId = 'oral' | 'dermal' | 'injection' | 'other'

export type MedicationRoute = {
  id: MedicationRouteId
  label: string
  description: string
}

export type MedicationFormOption = {
  id: string
  label: string
}

export const MEDICATION_ROUTES: MedicationRoute[] = [
  {
    id: 'oral',
    label: 'Oral',
    description: 'Taken by mouth — pills, liquids, and similar',
  },
  {
    id: 'dermal',
    label: 'Dermal',
    description: 'Applied to skin — creams, patches, and similar',
  },
  {
    id: 'injection',
    label: 'Injection',
    description: 'Given by needle — shots, pens, and similar',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Not listed above — describe how you take it on the next step',
  },
]

export const MEDICATION_FORMS_BY_ROUTE: Record<
  Exclude<MedicationRouteId, 'other'>,
  MedicationFormOption[]
> = {
  oral: [
    { id: 'pill', label: 'Pill' },
    { id: 'capsule', label: 'Capsule' },
    { id: 'tablet', label: 'Tablet' },
    { id: 'chewable', label: 'Chewable' },
    { id: 'liquid', label: 'Liquid / solution' },
    { id: 'syrup', label: 'Syrup' },
    { id: 'suspension', label: 'Suspension' },
    { id: 'powder', label: 'Powder' },
    { id: 'sublingual', label: 'Sublingual' },
    { id: 'lozenge', label: 'Lozenge / troche' },
    { id: 'spray-oral', label: 'Oral spray' },
  ],
  dermal: [
    { id: 'cream', label: 'Cream' },
    { id: 'ointment', label: 'Ointment' },
    { id: 'gel', label: 'Gel' },
    { id: 'lotion', label: 'Lotion' },
    { id: 'patch', label: 'Patch' },
    { id: 'foam', label: 'Foam' },
    { id: 'spray-topical', label: 'Topical spray' },
    { id: 'oil-topical', label: 'Oil' },
  ],
  injection: [
    { id: 'subcutaneous', label: 'Subcutaneous (SC)' },
    { id: 'intramuscular', label: 'Intramuscular (IM)' },
    { id: 'intravenous', label: 'Intravenous (IV)' },
    { id: 'prefilled-pen', label: 'Prefilled pen' },
    { id: 'auto-injector', label: 'Auto-injector' },
    { id: 'infusion', label: 'Infusion' },
  ],
}

export function isMedicationRouteId(value: string): value is MedicationRouteId {
  return (
    value === 'oral' ||
    value === 'dermal' ||
    value === 'injection' ||
    value === 'other'
  )
}

export function getRouteLabel(routeId: string | null | undefined): string | null {
  if (!routeId) return null
  return MEDICATION_ROUTES.find((r) => r.id === routeId)?.label ?? routeId
}

export function getFormLabel(
  routeId: MedicationRouteId | null | undefined,
  formId: string | null | undefined,
): string | null {
  if (!routeId || !formId) return null
  if (routeId === 'other') return formId
  return (
    MEDICATION_FORMS_BY_ROUTE[routeId]?.find((f) => f.id === formId)?.label ??
    formId
  )
}

export function formatMedicationType(
  routeId: string | null | undefined,
  formId: string | null | undefined,
): string | null {
  const route = routeId && isMedicationRouteId(routeId) ? routeId : null
  const routeLabel = getRouteLabel(route ?? undefined)
  const formLabel = route ? getFormLabel(route, formId) : null
  if (route === 'other' && formLabel) return formLabel
  if (routeLabel && formLabel) return `${formLabel} · ${routeLabel}`
  if (formLabel) return formLabel
  if (routeLabel) return routeLabel
  return null
}
