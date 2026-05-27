import { Alert, Pressable, Text, View } from 'react-native';
import { useTrackingStyles } from './trackingStyles';

type Option = { value: string; label: string; disabled?: boolean };

type Props = {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function SelectField({
  label,
  value,
  options,
  onChange,
  disabled,
  placeholder = 'Choose…',
}: Props) {
  const trackingStyles = useTrackingStyles();
  const selected = options.find((o) => o.value === value);

  function openPicker() {
    if (disabled) return;
    const enabled = options.filter((o) => !o.disabled);
    if (enabled.length === 0) return;
    Alert.alert(
      label,
      undefined,
      [
        ...enabled.map((opt) => ({
          text: opt.label,
          onPress: () => onChange(opt.value),
        })),
        { text: 'Cancel', style: 'destructive' },
      ],
    );
  }

  return (
    <View style={disabled ? trackingStyles.disabled : undefined}>
      <Text style={trackingStyles.label}>{label}</Text>
      <Pressable
        onPress={openPicker}
        disabled={disabled}
        style={trackingStyles.selectBtn}
        accessibilityRole="button"
      >
        <Text style={trackingStyles.selectBtnText}>
          {selected?.label ?? placeholder}
        </Text>
      </Pressable>
    </View>
  );
}
