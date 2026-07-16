import type { Gasto, GastoInput } from './types'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Point to your Vercel deployment
const BASE_URL = 'https://financito-eszr.vercel.app'
const SESSION_KEY = 'financito_session'

async function getHeaders(): Promise<HeadersInit> {
  const token = await AsyncStorage.getItem(SESSION_KEY)
  return {
    'Content-Type': 'application/json',
    ...(token ? { Cookie: `gastos_session=${token}` } : {}),
  }
}

export async function login(password: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
    credentials: 'include',
  })
  if (res.ok) {
    // Extract cookie from response
    const cookie = res.headers.get('set-cookie')
    const match = cookie?.match(/gastos_session=([^;]+)/)
    if (match) await AsyncStorage.setItem(SESSION_KEY, match[1])
  }
  return res.ok
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY)
}

export async function getGastos(params: {
  mes?: string
  moneda?: string
  categoria?: string
  cuenta?: string
} = {}): Promise<Gasto[]> {
  const query = new URLSearchParams()
  if (params.mes)       query.set('mes', params.mes)
  if (params.moneda)    query.set('moneda', params.moneda)
  if (params.categoria) query.set('categoria', params.categoria)
  if (params.cuenta)    query.set('cuenta', params.cuenta)

  const res = await fetch(`${BASE_URL}/api/gastos?${query}`, {
    headers: await getHeaders(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Error fetching gastos')
  return res.json()
}

export async function createGasto(data: GastoInput): Promise<Gasto> {
  const res = await fetch(`${BASE_URL}/api/gastos`, {
    method: 'POST',
    headers: await getHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error creating gasto')
  return res.json()
}

export async function updateGasto(id: string, data: Partial<GastoInput>): Promise<Gasto> {
  const res = await fetch(`${BASE_URL}/api/gastos/${id}`, {
    method: 'PATCH',
    headers: await getHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Error updating gasto')
  return res.json()
}

export async function deleteGasto(id: string): Promise<void> {
  await fetch(`${BASE_URL}/api/gastos/${id}`, {
    method: 'DELETE',
    headers: await getHeaders(),
    credentials: 'include',
  })
}

export async function sendChat(messages: any[], imageBase64?: string, imageMime?: string) {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: await getHeaders(),
    credentials: 'include',
    body: JSON.stringify({ messages, imageBase64, imageMime }),
  })
  if (!res.ok) throw new Error('Error in chat')
  return res.json()
}
