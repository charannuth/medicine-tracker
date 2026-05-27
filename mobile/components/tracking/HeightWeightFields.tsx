import { Text, TextInput, View } from 'react-native';
import {
  feetInchStringsToHeightCm,
  heightCmToFeetInchStrings,
  kgToLbString,
  lbStringToKg,
  type BodyMetricUnit,
} from '../../lib/bodyMetrics';
import { SelectField } from './SelectField';
import { useTrackingStyles } from './trackingStyles';

const UNIT_OPTIONS = [
  { value: 'metric', label: 'Metric' },
  { value: 'imperial', label: 'US / Imperial' },
];

type Props = {
  height_cm: string;
  weight_kg: string;
  height_unit: BodyMetricUnit;
  weight_unit: BodyMetricUnit;
  onHeightChange: (height_cm: string) => void;
  onWeightChange: (weight_kg: string) => void;
  onHeightUnitChange: (unit: BodyMetricUnit) => void;
  onWeightUnitChange: (unit: BodyMetricUnit) => void;
};

export function HeightWeightFields({
  height_cm,
  weight_kg,
  height_unit,
  weight_unit,
  onHeightChange,
  onWeightChange,
  onHeightUnitChange,
  onWeightUnitChange,
}: Props) {
  const trackingStyles = useTrackingStyles();
  const { feet, inches } = heightCmToFeetInchStrings(height_cm);
  const weightLb = kgToLbString(weight_kg);

  return (
    <View>
      <SelectField
        label="Height units"
        value={height_unit}
        options={UNIT_OPTIONS}
        onChange={(v) => onHeightUnitChange(v as BodyMetricUnit)}
      />
      {height_unit === 'metric' ? (
        <View>
          <Text style={trackingStyles.label}>Height (cm)</Text>
          <TextInput
            style={trackingStyles.input}
            keyboardType="decimal-pad"
            value={height_cm}
            onChangeText={onHeightChange}
            placeholder="e.g. 170"
          />
        </View>
      ) : (
        <View style={trackingStyles.row}>
          <View style={{ flex: 1 }}>
            <Text style={trackingStyles.label}>Feet</Text>
            <TextInput
              style={trackingStyles.input}
              keyboardType="number-pad"
              value={feet}
              onChangeText={(v) => onHeightChange(feetInchStringsToHeightCm(v, inches))}
              placeholder="5"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={trackingStyles.label}>Inches</Text>
            <TextInput
              style={trackingStyles.input}
              keyboardType="number-pad"
              value={inches}
              onChangeText={(v) => onHeightChange(feetInchStringsToHeightCm(feet, v))}
              placeholder="7"
            />
          </View>
        </View>
      )}

      <SelectField
        label="Weight units"
        value={weight_unit}
        options={UNIT_OPTIONS}
        onChange={(v) => onWeightUnitChange(v as BodyMetricUnit)}
      />
      <Text style={trackingStyles.label}>
        {weight_unit === 'metric' ? 'Weight (kg)' : 'Weight (lb)'}
      </Text>
      <TextInput
        style={trackingStyles.input}
        keyboardType="decimal-pad"
        value={weight_unit === 'metric' ? weight_kg : weightLb}
        onChangeText={(v) =>
          onWeightChange(weight_unit === 'metric' ? v : lbStringToKg(v))
        }
        placeholder={weight_unit === 'metric' ? 'e.g. 68' : 'e.g. 150'}
      />
    </View>
  );
}
