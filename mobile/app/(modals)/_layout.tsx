import { Stack } from 'expo-router';

export default function ModalLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="medications/new"
        options={{ title: 'Add medication', presentation: 'modal' }}
      />
      <Stack.Screen
        name="medications/[id]"
        options={{ title: 'Edit medication', presentation: 'modal' }}
      />
    </Stack>
  );
}

