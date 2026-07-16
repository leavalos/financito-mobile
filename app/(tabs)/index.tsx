import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getGastos, logout } from '../../lib/api'
import { useRouter } from 'expo-router'
import type { Gasto, Moneda } from '../../lib/types'
import { MONEDAS, MONEDA_SYMBOL, CATEGORIA_COLORS, CATEGORIA_EMOJI } from '../../lib/types'
import { colors } from '../../lib/theme'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(n)

const thisMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const monthLabel = (mes: string) => {
  const [y, m] = mes.split('-')
  return new Date(Number(y), Number(m) - 1)
    .toLocaleString('es-CL', { month: 'long', year: 'numeric' })
}

export default function HomeScreen() {
  const [gastos, setGastos]     = useState<Gasto[]>([])
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [moneda, setMoneda]     = useState<Moneda>('CLP')
  const [mes, setMes]           = useState(thisMonth())
  const router = useRouter()

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await getGastos({ mes, moneda })
      setGastos(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [mes, moneda])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const total     = gastos.reduce((s, g) => s + g.valor, 0)
  const pagado    = gastos.filter(g => g.pagado).reduce((s, g) => s + g.valor, 0)
  const pendiente = total - pagado
  const sym       = MONEDA_SYMBOL[moneda]
  const recent    = gastos.slice(0, 8)

  async function handleLogout() {
    await logout()
    router.replace('/login')
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Nav */}
        <View style={styles.nav}>
          <Text style={styles.navLogo}>🐷</Text>
          <Text style={styles.navTitle}>Financito</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          {/* Moneda selector */}
          <View style={styles.monedaRow}>
            {MONEDAS.map(m => (
              <TouchableOpacity
                key={m}
                onPress={() => setMoneda(m)}
                style={[styles.monedaPill, moneda === m && styles.monedaPillActive]}
              >
                <Text style={[styles.monedaText, moneda === m && styles.monedaTextActive]}>
                  {m === 'CLP' ? '🇨🇱' : m === 'USD' ? '🇺🇸' : '🇦🇷'} {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Total */}
          <Text style={styles.totalLabel}>TOTAL {monthLabel(mes).toUpperCase()}</Text>
          {loading ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: 16 }} />
          ) : (
            <View style={styles.totalRow}>
              <Text style={styles.totalSym}>{sym}</Text>
              <Text style={styles.totalAmount}>{fmt(total)}</Text>
            </View>
          )}

          {/* Pills */}
          {!loading && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsRow}>
              <View style={[styles.pill, styles.pillGreen]}>
                <View style={[styles.pillDot, { backgroundColor: colors.green }]} />
                <Text style={[styles.pillText, { color: colors.green }]}>
                  Pagado {sym}{fmt(pagado)}
                </Text>
              </View>
              {pendiente > 0 && (
                <View style={[styles.pill, styles.pillAmber]}>
                  <View style={[styles.pillDot, { backgroundColor: colors.amber }]} />
                  <Text style={[styles.pillText, { color: colors.amber }]}>
                    Pendiente {sym}{fmt(pendiente)}
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>

        {/* Recent gastos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ÚLTIMOS GASTOS</Text>
          {loading ? (
            <ActivityIndicator color={colors.accent} />
          ) : recent.length === 0 ? (
            <Text style={styles.empty}>Sin gastos este mes</Text>
          ) : (
            recent.map(g => (
              <View key={g.id} style={styles.gastoCard}>
                <View style={[styles.gastoIcon, { backgroundColor: CATEGORIA_COLORS[g.categoria] + '22' }]}>
                  <Text style={styles.gastoEmoji}>{CATEGORIA_EMOJI[g.categoria]}</Text>
                </View>
                <View style={styles.gastoInfo}>
                  <Text style={styles.gastoNombre} numberOfLines={1}>{g.nombre}</Text>
                  <Text style={styles.gastoMeta}>{g.fecha} · {g.cuenta}</Text>
                </View>
                <View style={styles.gastoRight}>
                  <Text style={styles.gastoValor}>{sym}{fmt(g.valor)}</Text>
                  <Text style={[styles.gastoPagado, { color: g.pagado ? colors.green : colors.amber }]}>
                    {g.pagado ? '✓ pagado' : '● pendiente'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.bg },
  scroll:      { flex: 1 },
  nav: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, paddingBottom: 8,
  },
  navLogo:     { fontSize: 26, marginRight: 8 },
  navTitle:    { fontSize: 16, fontWeight: '700', color: colors.accent, flex: 1 },
  logoutBtn:   { backgroundColor: colors.bg3, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  logoutText:  { color: colors.muted, fontSize: 12 },
  hero: {
    backgroundColor: colors.bg2,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  monedaRow:   { flexDirection: 'row', gap: 8, marginBottom: 20 },
  monedaPill:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.bg3 },
  monedaPillActive: { backgroundColor: colors.accent },
  monedaText:  { fontSize: 12, fontWeight: '500', color: colors.muted },
  monedaTextActive: { color: '#fff' },
  totalLabel:  { fontSize: 11, color: colors.muted, letterSpacing: 1, marginBottom: 6 },
  totalRow:    { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
  totalSym:    { fontSize: 20, color: colors.muted, marginRight: 4, marginBottom: 6 },
  totalAmount: { fontSize: 48, fontWeight: '700', color: colors.text, letterSpacing: -1 },
  pillsRow:    { flexDirection: 'row' },
  pill:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8, borderWidth: 1, gap: 6 },
  pillGreen:   { backgroundColor: 'rgba(43,191,179,0.12)', borderColor: 'rgba(43,191,179,0.3)' },
  pillAmber:   { backgroundColor: 'rgba(245,160,90,0.12)', borderColor: 'rgba(245,160,90,0.3)' },
  pillDot:     { width: 6, height: 6, borderRadius: 3 },
  pillText:    { fontSize: 12, fontWeight: '500' },
  section:     { padding: 20 },
  sectionTitle: { fontSize: 11, color: colors.muted, letterSpacing: 1, marginBottom: 12, fontWeight: '600' },
  empty:       { color: colors.muted, fontSize: 13, textAlign: 'center', paddingVertical: 24 },
  gastoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg2,
    borderRadius: 14, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border, gap: 12,
  },
  gastoIcon:   { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  gastoEmoji:  { fontSize: 18 },
  gastoInfo:   { flex: 1 },
  gastoNombre: { fontSize: 13, fontWeight: '500', color: colors.text, marginBottom: 2 },
  gastoMeta:   { fontSize: 11, color: colors.muted },
  gastoRight:  { alignItems: 'flex-end' },
  gastoValor:  { fontSize: 14, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  gastoPagado: { fontSize: 10, fontWeight: '500', marginTop: 2 },
})
