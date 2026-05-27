import { Text, View, Pressable } from 'react-native';
import { trackingStyles } from './trackingStyles';

type Props = {
  title: string;
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
};

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function ChipMultiSelect({ title, options, selected, onChange, disabled }: Props) {
  return (
    <View style={disabled ? trackingStyles.disabled : undefined}>
      <Text style={trackingStyles.label}>{title}</Text>
      <View style={trackingStyles.chipWrap}>
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <Pressable
              key={opt}
              disabled={disabled}
              onPress={() => onChange(toggle(selected, opt))}
              style={[trackingStyles.chip, active && trackingStyles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[trackingStyles.chipText, active && trackingStyles.chipTextActive]}>
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
