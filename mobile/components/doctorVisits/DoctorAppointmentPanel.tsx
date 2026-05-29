import { Pressable, Text, TextInput, View } from 'react-native';
import {
  DOCTOR_APPOINTMENT_TYPES,
  type DoctorAppointmentType,
  type DoctorVisitInput,
} from '../../lib/doctorVisits';
import { useTrackingStyles } from '../tracking/trackingStyles';

type Props = {
  value: DoctorVisitInput;
  onChange: (next: DoctorVisitInput) => void;
  onSave: () => void;
  onDiscard: () => void;
  busy?: boolean;
  mode: 'schedule' | 'edit';
  submitLabel?: string;
  appointmentFieldsKey?: number;
};

export function DoctorAppointmentPanel({
  value,
  onChange,
  onSave,
  onDiscard,
  busy = false,
  mode,
  submitLabel,
  appointmentFieldsKey = 0,
}: Props) {
  const track = useTrackingStyles();
  const isScheduleMode = mode === 'schedule';

  function setField<K extends keyof DoctorVisitInput>(key: K, fieldValue: DoctorVisitInput[K]) {
    onChange({ ...value, [key]: fieldValue });
  }

  return (
    <View style={track.card}>
      <Text style={track.sectionTitle}>
        {isScheduleMode ? 'Schedule appointment' : 'Appointment details'}
      </Text>
      {!isScheduleMode ? (
        <Text style={track.hint}>When and who you saw — save this section on its own.</Text>
      ) : null}

      <Text style={track.label}>Time (optional)</Text>
      <TextInput
        style={track.input}
        value={value.visit_time}
        onChangeText={(text) => setField('visit_time', text)}
        placeholder="e.g. 2:30 PM"
        placeholderTextColor={track.hint.color}
        editable={!busy}
      />

      <Text style={track.label}>Appointment type</Text>
      <View
        key={`appointment-type-${appointmentFieldsKey}-${value.appointment_type}`}
        style={track.chipWrap}
      >
        {DOCTOR_APPOINTMENT_TYPES.map((option) => {
          const active = value.appointment_type === option.id;
          return (
            <Pressable
              key={option.id}
              style={[track.chip, active && track.chipActive]}
              onPress={() => setField('appointment_type', option.id as DoctorAppointmentType)}
              disabled={busy}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[track.chipText, active && track.chipTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={track.label}>Doctor or clinic</Text>
      <TextInput
        style={track.input}
        value={value.provider_name}
        onChangeText={(text) => setField('provider_name', text)}
        placeholder="Dr. Smith or City Health Clinic"
        placeholderTextColor={track.hint.color}
        editable={!busy}
      />

      <Text style={track.label}>Specialty (optional)</Text>
      <TextInput
        style={track.input}
        value={value.specialty}
        onChangeText={(text) => setField('specialty', text)}
        placeholder="Primary care, cardiology…"
        placeholderTextColor={track.hint.color}
        editable={!busy}
      />

      <Text style={track.label}>Location (optional)</Text>
      <TextInput
        style={track.input}
        value={value.location}
        onChangeText={(text) => setField('location', text)}
        placeholder="Office address or telehealth"
        placeholderTextColor={track.hint.color}
        editable={!busy}
      />

      <Text style={track.label}>{isScheduleMode ? 'Reason for visit' : 'Reason (optional)'}</Text>
      <TextInput
        style={[track.input, track.textarea]}
        value={value.reason}
        onChangeText={(text) => setField('reason', text)}
        placeholder="Annual check-up, follow-up labs, new symptoms…"
        placeholderTextColor={track.hint.color}
        multiline
        editable={!busy}
      />

      <View style={track.row}>
        <Pressable
          style={[track.primaryBtn, busy && track.disabled]}
          onPress={onSave}
          disabled={busy}
        >
          <Text style={track.primaryBtnText}>{busy ? 'Saving…' : submitLabel ?? 'Save visit'}</Text>
        </Pressable>
        <Pressable style={track.ghostBtn} onPress={onDiscard} disabled={busy}>
          <Text style={track.ghostBtnText}>Discard edits</Text>
        </Pressable>
      </View>
    </View>
  );
}
