import {
  feetInchStringsToHeightCm,
  heightCmToFeetInchStrings,
  kgToLbString,
  lbStringToKg,
  type BodyMetricUnit,
} from '../lib/bodyMetrics'

type HeightWeightFieldsProps = {
  height_cm: string
  weight_kg: string
  height_unit: BodyMetricUnit
  weight_unit: BodyMetricUnit
  onHeightChange: (height_cm: string) => void
  onWeightChange: (weight_kg: string) => void
  onHeightUnitChange: (unit: BodyMetricUnit) => void
  onWeightUnitChange: (unit: BodyMetricUnit) => void
  fieldClassName?: string
  rowClassName?: string
}

const UNIT_OPTIONS: { value: BodyMetricUnit; label: string }[] = [
  { value: 'metric', label: 'Metric' },
  { value: 'imperial', label: 'US / Imperial' },
]

export function HeightWeightFields({
  height_cm,
  weight_kg,
  height_unit,
  weight_unit,
  onHeightChange,
  onWeightChange,
  onHeightUnitChange,
  onWeightUnitChange,
  fieldClassName = 'tracking-field',
  rowClassName = 'tracking-stats-row',
}: HeightWeightFieldsProps) {
  const { feet, inches } = heightCmToFeetInchStrings(height_cm)
  const weightLb = kgToLbString(weight_kg)

  const rowClass = [
    rowClassName,
    height_unit === 'imperial' ? 'body-metrics-row--height-imperial' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rowClass}>
      <div className="body-metric-field body-metric-field--height">
        <div className="body-metric-field-header">
          <span className="body-metric-field-title">Height</span>
          <label className="body-metric-unit-select">
            <span className="visually-hidden">Height units</span>
            <select
              value={height_unit}
              onChange={(e) => onHeightUnitChange(e.target.value as BodyMetricUnit)}
              aria-label="Height units"
            >
              {UNIT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="body-metric-field-inputs">
          {height_unit === 'metric' ? (
            <label className={fieldClassName}>
              <span className="visually-hidden">Height in centimeters</span>
              <input
                type="number"
                min={0}
                step={0.1}
                value={height_cm}
                onChange={(e) => onHeightChange(e.target.value)}
                placeholder="e.g. 170"
                aria-label="Height in centimeters"
              />
              <span className="body-metric-suffix">cm</span>
            </label>
          ) : (
            <div className="body-metric-imperial-height">
              <label className={fieldClassName}>
                <span className="body-metric-suffix-label">ft</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={feet}
                  onChange={(e) =>
                    onHeightChange(feetInchStringsToHeightCm(e.target.value, inches))
                  }
                  placeholder="5"
                  aria-label="Height feet"
                />
              </label>
              <label className={fieldClassName}>
                <span className="body-metric-suffix-label">in</span>
                <input
                  type="number"
                  min={0}
                  max={11}
                  step={1}
                  value={inches}
                  onChange={(e) =>
                    onHeightChange(feetInchStringsToHeightCm(feet, e.target.value))
                  }
                  placeholder="7"
                  aria-label="Height inches"
                />
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="body-metric-field body-metric-field--weight">
        <div className="body-metric-field-header">
          <span className="body-metric-field-title">Weight</span>
          <label className="body-metric-unit-select">
            <span className="visually-hidden">Weight units</span>
            <select
              value={weight_unit}
              onChange={(e) => onWeightUnitChange(e.target.value as BodyMetricUnit)}
              aria-label="Weight units"
            >
              {UNIT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="body-metric-field-inputs body-metric-field-inputs--weight">
          <label className={fieldClassName}>
            <span className="visually-hidden">
              {weight_unit === 'metric' ? 'Weight in kilograms' : 'Weight in pounds'}
            </span>
            <input
              type="number"
              min={0}
              step={weight_unit === 'metric' ? 0.1 : 0.1}
              value={weight_unit === 'metric' ? weight_kg : weightLb}
              onChange={(e) =>
                onWeightChange(
                  weight_unit === 'metric' ? e.target.value : lbStringToKg(e.target.value),
                )
              }
              placeholder={weight_unit === 'metric' ? 'e.g. 68' : 'e.g. 150'}
              aria-label={
                weight_unit === 'metric' ? 'Weight in kilograms' : 'Weight in pounds'
              }
            />
            <span className="body-metric-suffix">
              {weight_unit === 'metric' ? 'kg' : 'lb'}
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}
