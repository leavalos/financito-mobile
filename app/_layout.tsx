import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter, useSegments } from 'expo-router'
import { enableScreens } from 'react-native-screens'
import { colors } from '../lib/theme'

// Expo Go en SDK 54 trae un bug nativo en react-native-screens que crashea
// cualquier Stack/Tabs con "expected dynamic type 'boolean', but had type 'string'".
// Desactivamos las screens nativas para forzar navegación basada en JS y
// esquivar el código nativo roto (ver software-mansion/react-native-screens#3470).
enableScreens(false)

export default function RootLayout() {
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    AsyncStorage.getItem('financito_session').then(token => {
      setAuthed(!!token)
      setReady(true)
    })
  }, [])

  useEffect(() => {
    if (!ready) return
    const inAuth = segments[0] === 'login'
    if (!authed && !inAuth) router.replace('/login')
    if (authed && inAuth)  router.replace('/(tabs)')
  }, [ready, authed, segments])

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />

  return (
    <>
      <StatusBar style="light" backgroundColor={colors.bg} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  )
}
