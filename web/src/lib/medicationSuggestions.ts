export type MedicationSuggestion = {
  name: string
  doseMg?: string
  dosePills?: string
}

/** Common medications for name autocomplete (generic names). */
export const MEDICATION_SUGGESTIONS: MedicationSuggestion[] = [
  { name: 'Acetaminophen', doseMg: '500 mg', dosePills: '1 tablet' },
  { name: 'Albuterol', dosePills: '2 puffs' },
  { name: 'Allopurinol', doseMg: '300 mg' },
  { name: 'Amlodipine', doseMg: '5 mg' },
  { name: 'Amoxicillin', doseMg: '500 mg' },
  { name: 'Aspirin', doseMg: '81 mg', dosePills: '1 tablet' },
  { name: 'Atenolol', doseMg: '50 mg' },
  { name: 'Atorvastatin', doseMg: '20 mg' },
  { name: 'Azithromycin', doseMg: '250 mg' },
  { name: 'Baclofen', doseMg: '10 mg' },
  { name: 'Benazepril', doseMg: '10 mg' },
  { name: 'Bisoprolol', doseMg: '5 mg' },
  { name: 'Bupropion', doseMg: '150 mg' },
  { name: 'Buspirone', doseMg: '10 mg' },
  { name: 'Carvedilol', doseMg: '12.5 mg' },
  { name: 'Celecoxib', doseMg: '200 mg' },
  { name: 'Cetirizine', doseMg: '10 mg' },
  { name: 'Citalopram', doseMg: '20 mg' },
  { name: 'Clonazepam', doseMg: '0.5 mg' },
  { name: 'Clonidine', doseMg: '0.1 mg' },
  { name: 'Clopidogrel', doseMg: '75 mg' },
  { name: 'Cyclobenzaprine', doseMg: '10 mg' },
  { name: 'Dexamethasone', doseMg: '4 mg' },
  { name: 'Diazepam', doseMg: '5 mg' },
  { name: 'Diclofenac', doseMg: '50 mg' },
  { name: 'Digoxin', doseMg: '0.125 mg' },
  { name: 'Diltiazem', doseMg: '120 mg' },
  { name: 'Doxycycline', doseMg: '100 mg' },
  { name: 'Duloxetine', doseMg: '60 mg' },
  { name: 'Enalapril', doseMg: '10 mg' },
  { name: 'Escitalopram', doseMg: '10 mg' },
  { name: 'Esomeprazole', doseMg: '40 mg' },
  { name: 'Ezetimibe', doseMg: '10 mg' },
  { name: 'Famotidine', doseMg: '20 mg' },
  { name: 'Fenofibrate', doseMg: '145 mg' },
  { name: 'Ferrous sulfate', doseMg: '325 mg' },
  { name: 'Finasteride', doseMg: '5 mg' },
  { name: 'Fluconazole', doseMg: '150 mg' },
  { name: 'Fluoxetine', doseMg: '20 mg' },
  { name: 'Fluticasone', dosePills: '2 sprays' },
  { name: 'Folic acid', doseMg: '1 mg' },
  { name: 'Furosemide', doseMg: '40 mg' },
  { name: 'Gabapentin', doseMg: '300 mg' },
  { name: 'Glimepiride', doseMg: '2 mg' },
  { name: 'Glipizide', doseMg: '5 mg' },
  { name: 'Hydrochlorothiazide', doseMg: '25 mg' },
  { name: 'Hydrocodone-acetaminophen', doseMg: '5/325 mg' },
  { name: 'Hydroxyzine', doseMg: '25 mg' },
  { name: 'Ibuprofen', doseMg: '200 mg', dosePills: '1 tablet' },
  { name: 'Insulin glargine', doseMg: '10 units' },
  { name: 'Insulin lispro', doseMg: '4 units' },
  { name: 'Irbesartan', doseMg: '150 mg' },
  { name: 'Lamotrigine', doseMg: '100 mg' },
  { name: 'Lansoprazole', doseMg: '30 mg' },
  { name: 'Levothyroxine', doseMg: '50 mcg' },
  { name: 'Lisinopril', doseMg: '10 mg' },
  { name: 'Loratadine', doseMg: '10 mg' },
  { name: 'Lorazepam', doseMg: '0.5 mg' },
  { name: 'Losartan', doseMg: '50 mg' },
  { name: 'Lovastatin', doseMg: '20 mg' },
  { name: 'Melatonin', doseMg: '3 mg' },
  { name: 'Meloxicam', doseMg: '15 mg' },
  { name: 'Metformin', doseMg: '500 mg' },
  { name: 'Methotrexate', doseMg: '2.5 mg' },
  { name: 'Metoprolol', doseMg: '50 mg' },
  { name: 'Metronidazole', doseMg: '500 mg' },
  { name: 'Montelukast', doseMg: '10 mg' },
  { name: 'Mirtazapine', doseMg: '15 mg' },
  { name: 'Naproxen', doseMg: '220 mg' },
  { name: 'Nitroglycerin', doseMg: '0.4 mg' },
  { name: 'Olmesartan', doseMg: '20 mg' },
  { name: 'Omeprazole', doseMg: '20 mg' },
  { name: 'Ondansetron', doseMg: '4 mg' },
  { name: 'Oxycodone', doseMg: '5 mg' },
  { name: 'Pantoprazole', doseMg: '40 mg' },
  { name: 'Paroxetine', doseMg: '20 mg' },
  { name: 'Potassium chloride', doseMg: '20 mEq' },
  { name: 'Pravastatin', doseMg: '40 mg' },
  { name: 'Prednisone', doseMg: '10 mg' },
  { name: 'Pregabalin', doseMg: '75 mg' },
  { name: 'Propranolol', doseMg: '40 mg' },
  { name: 'Quetiapine', doseMg: '25 mg' },
  { name: 'Ramipril', doseMg: '5 mg' },
  { name: 'Ranitidine', doseMg: '150 mg' },
  { name: 'Rivaroxaban', doseMg: '20 mg' },
  { name: 'Rosuvastatin', doseMg: '10 mg' },
  { name: 'Sertraline', doseMg: '50 mg' },
  { name: 'Simvastatin', doseMg: '20 mg' },
  { name: 'Spironolactone', doseMg: '25 mg' },
  { name: 'Sumatriptan', doseMg: '50 mg' },
  { name: 'Tamsulosin', doseMg: '0.4 mg' },
  { name: 'Telmisartan', doseMg: '40 mg' },
  { name: 'Tizanidine', doseMg: '4 mg' },
  { name: 'Topiramate', doseMg: '50 mg' },
  { name: 'Tramadol', doseMg: '50 mg' },
  { name: 'Trazodone', doseMg: '50 mg' },
  { name: 'Triamcinolone', dosePills: '1 application' },
  { name: 'Valacyclovir', doseMg: '500 mg' },
  { name: 'Valsartan', doseMg: '80 mg' },
  { name: 'Venlafaxine', doseMg: '75 mg' },
  { name: 'Verapamil', doseMg: '120 mg' },
  { name: 'Vitamin B12', doseMg: '1000 mcg' },
  { name: 'Vitamin D3', doseMg: '2000 IU' },
  { name: 'Warfarin', doseMg: '5 mg' },
  { name: 'Zolpidem', doseMg: '10 mg' },
]

export function searchMedicationSuggestions(
  query: string,
  limit = 8,
): MedicationSuggestion[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  return MEDICATION_SUGGESTIONS.filter((med) =>
    med.name.toLowerCase().includes(q),
  )
    .sort((a, b) => {
      const aName = a.name.toLowerCase()
      const bName = b.name.toLowerCase()
      const aStarts = aName.startsWith(q) ? 0 : 1
      const bStarts = bName.startsWith(q) ? 0 : 1
      if (aStarts !== bStarts) return aStarts - bStarts
      return aName.localeCompare(bName)
    })
    .slice(0, limit)
}
