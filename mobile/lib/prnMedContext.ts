import type { MedForPrnSymptoms } from './prnSymptoms'

export type PrnMedCategory =
  | 'anxiety'
  | 'respiratory'
  | 'diabetes'
  | 'pain'
  | 'allergy'
  | 'gi'
  | 'general'

function nameMatches(name: string, patterns: string[]): boolean {
  const lower = name.toLowerCase()
  return patterns.some((p) => lower.includes(p))
}

export function inferPrnMedCategory(med: MedForPrnSymptoms): PrnMedCategory {
  const name = med.name
  if (
    nameMatches(name, [
      'xanax',
      'alprazolam',
      'ativan',
      'lorazepam',
      'klonopin',
      'clonazepam',
      'buspar',
      'buspirone',
      'hydroxyzine',
      'anxiety',
    ])
  ) {
    return 'anxiety'
  }
  if (
    nameMatches(name, [
      'glimepiride',
      'glipizide',
      'glyburide',
      'insulin',
      'metformin',
      'ozempic',
      'mounjaro',
      'trulicity',
      'blood sugar',
      'hypogly',
    ])
  ) {
    return 'diabetes'
  }
  if (
    nameMatches(name, [
      'albuterol',
      'ventolin',
      'inhaler',
      'symbicort',
      'advair',
      'wheez',
    ])
  ) {
    return 'respiratory'
  }
  if (
    nameMatches(name, [
      'ibuprofen',
      'advil',
      'acetaminophen',
      'tylenol',
      'naproxen',
      'tramadol',
      'hydrocodone',
      'oxycodone',
    ])
  ) {
    return 'pain'
  }
  if (
    nameMatches(name, [
      'benadryl',
      'epinephrine',
      'epipen',
      'loratadine',
      'cetirizine',
      'allergy',
    ])
  ) {
    return 'allergy'
  }
  if (
    nameMatches(name, [
      'ondansetron',
      'zofran',
      'antacid',
      'pepto',
      'nausea',
    ])
  ) {
    return 'gi'
  }
  return 'general'
}

export type PrnExtraDoseGuidance = {
  headline: string
  body: string
  reasonPlaceholder: string
  notesPlaceholder: string
}

export function prnExtraDoseGuidance(
  med: MedForPrnSymptoms,
  dosesAlreadyToday: number,
): PrnExtraDoseGuidance | null {
  if (dosesAlreadyToday < 1) return null

  const name = med.name.trim() || 'this medication'
  const category = inferPrnMedCategory(med)

  switch (category) {
    case 'anxiety':
      return {
        headline: 'Extra dose check-in',
        body: `You're logging another dose of ${name}. Note what you were doing or feeling before this dose — not a diagnosis, just context for you and your doctor. Complete today's wellness check-in too if you haven't.`,
        reasonPlaceholder:
          'e.g. panic before meeting, couldn’t sleep, chest felt tight',
        notesPlaceholder:
          'What helped before, who you were with, stressors today…',
      }
    case 'diabetes':
      return {
        headline: 'Extra dose check-in',
        body: `Log why you're taking another dose of ${name}. In your daily wellness log, note what you ate — patterns can help your clinician, but this app can't say what caused a high or low.`,
        reasonPlaceholder:
          'e.g. felt shaky, glucose reading was high, missed lunch',
        notesPlaceholder:
          'What you ate recently, activity, how you felt…',
      }
    case 'respiratory':
      return {
        headline: 'Extra dose check-in',
        body: `Another dose of ${name}. Describe symptoms and triggers (activity, weather, exposure) for your visit report — we won't label a single cause.`,
        reasonPlaceholder: 'e.g. wheezing after stairs, tight chest',
        notesPlaceholder: 'What you were doing, what improved last time…',
      }
    case 'pain':
      return {
        headline: 'Extra dose check-in',
        body: `Log what pain or discomfort led to this extra dose of ${name}. Your daily wellness log on the same day helps spot patterns for your clinician.`,
        reasonPlaceholder: 'e.g. headache returned, joint flared up',
        notesPlaceholder: 'Severity 1–10, what you tried first…',
      }
    case 'allergy':
      return {
        headline: 'Extra dose check-in',
        body: `Note symptoms and possible triggers for this dose of ${name} — for your records, not an official allergy diagnosis.`,
        reasonPlaceholder: 'e.g. hives after meal, itchy eyes outdoors',
        notesPlaceholder: 'Exposure you suspect, other meds taken…',
      }
    case 'gi':
      return {
        headline: 'Extra dose check-in',
        body: `Describe nausea or stomach symptoms before this dose of ${name}. Same-day wellness notes help your doctor see the bigger picture.`,
        reasonPlaceholder: 'e.g. nausea after eating, acid reflux',
        notesPlaceholder: 'Food, timing, what helped before…',
      }
    default:
      return {
        headline: 'Extra dose check-in',
        body: `You're taking another dose of ${name}. Log how you feel and what was going on — saved for your doctor visit report.`,
        reasonPlaceholder: 'Why you needed it now',
        notesPlaceholder: 'Context for your next appointment…',
      }
  }
}

export function copingTipsForCategory(category: PrnMedCategory): string[] {
  switch (category) {
    case 'anxiety':
      return [
        'Slow breathing: inhale 4 sec, hold 4, exhale 6 — repeat a few cycles.',
        'Grounding: name 5 things you see, 4 you feel, 3 you hear.',
        "Short walk or stretch if you're able — movement can help some people.",
        "Reach out to someone you trust or your care team's crisis line if symptoms feel unmanageable.",
      ]
    case 'diabetes':
      return [
        "Follow your clinician's plan for checking glucose when symptoms change.",
        'Note meals, timing, and activity in your daily wellness log the same day.',
        'Keep fast-acting carbs handy if you use insulin or sulfonylureas — ask your pharmacist how.',
        'Bring food logs and dose times to your appointment; patterns help your team adjust care.',
      ]
    case 'respiratory':
      return [
        'Sit upright, loosen tight clothing, use your prescribed inhaler technique.',
        'Avoid smoke and strong scents; note weather or air quality in your log.',
        'If rescue inhaler use increases for several days, contact your clinician.',
      ]
    case 'pain':
      return [
        'Ice or heat (whichever you usually find helpful) for 15–20 minutes.',
        'Gentle movement if safe; rest if movement worsens pain.',
        'Track pain level in wellness notes so your doctor sees trends.',
      ]
    case 'allergy':
      return [
        'Rinse exposed skin; remove clothing that touched the allergen if relevant.',
        'Note possible triggers in your log for your allergist.',
        'Seek emergency care for trouble breathing, swelling of lips/tongue, or dizziness.',
      ]
    case 'gi':
      return [
        'Sip water; avoid heavy or spicy food until you feel better.',
        'Log what you ate and when in your daily wellness check-in.',
        'Contact your clinician if vomiting, fever, or severe pain persists.',
      ]
    default:
      return [
        "Note what you were doing and how you felt in today's wellness check-in.",
        "Bring this app's visit report to your next appointment.",
        'Call your clinician or emergency services for severe or new symptoms.',
      ]
  }
}
