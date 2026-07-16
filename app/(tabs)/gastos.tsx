import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Alert, ActivityIndicator,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getGastos, deleteGasto, updateGasto } from '../../lib/api'
import type { Gasto, Moneda } from '../../lib/types'
import { CATEGORIAS, CUENTAS, MONEDAS, MONEDA_SYMBOL, CATEGORIA_COLORS, CATEGORIA_EMOJI } from '../../lib/types'
import { colors } from '../../lib/theme'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(n)

const thisMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function GastosScreen() {
  const [gastos, setGastos]     = useState<Gasto[]>([])
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [moneda, setMoneda]     = useState<Moneda>('CLP')
  const [mes, setMes]           = useState(thisMonth())
  const [categoria, setCategoria] = useState('')

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await getGastos({ mes, moneda, categoria: categoria || undefined })
      setGastos(data)
    } catch {}
    finally { setLoading(false); setRefreshing(false) }
  }, [mes, moneda, categoria])

  useFocusEffect(useCallback(() => { load() }, [load]))

  async function handleDelete(g: Gasto) {
    Alert.alert('Eliminar', `¿Eliminar "${g.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await deleteGasto(g.id)
        load()
      }},
    ])
  }

  async function handleToggle(g: Gasto) {
    await updateGasto(g.id, { pagado: !g.pagado })
    load()
  }

  const total    = gastos.reduce((s, g) => s + g.valor, 0)
  const pagado   = gastos.filter(g => g.pagado).reduce((s, g) => s + g.valor, 0)
  const sym      = MONEDA_SYMBOL[moneda]

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gastos</Text>
        <Text style={styles.headerSub}>
          {gastos.length} registros · {sym}{fmt(total)}
        </Text>
      </View>

      {/* Moneda filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {MONEDAS.map(m => (
          <TouchableOpacity key={m} onPress={() => setMoneda(m)} style={[styles.filterPill, moneda === m && styles.filterPillActive]}>
            <Text style={[styles.filterText, moneda === m && styles.filterTextActive]}>
              {m === 'CLP' ? '🇨🇱' : m === 'USD' ? '🇺🇸' : '🇦🇷'} {m}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={styles.filterDivider} />
        <TouchableOpacity onPress={() => setCategoria('')} style={[styles.filterPill, !categoria && styles.filterPillActive]}>
          <Text style={[styles.filterText, !categoria && styles.filterTextActive]}>Todas</Text>
        </TouchableOpacity>
        {CATEGORIAS.map(c => (
          <TouchableOpacity key={c} onPress={() => setCategoria(c === categoria ? '' : c)} style={[styles.filterPill, categoria === c && styles.filterPillActive]}>
            <Text style={[styles.filterText, categoria === c && styles.filterTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={[styles.statPill, { backgroundColor: 'rgba(43,191,179,0.12)' }]}>
          <Text style={[styles.statText, { color: colors.green }]}>✓ Pagado {sym}{fmt(pagado)}</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: 'rgba(245,160,90,0.12)' }]}>
          <Text style={[styles.statText, { color: colors.amber }]}>● Pendiente {sym}{fmt(total - pagado)}</Text>
        </View>
      </View>

      {/* List */}
      <ScrollView
        style={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        ) : gastos.length === 0 ? (
          <Text style={styles.empty}>Sin gastos para los filtros seleccionados</Text>
        ) : (
          gastos.map(g => (
            <View key={g.id} style={styles.card}>
              <View style={[styles.cardIcon, { backgroundColor: CATEGORIA_COLORS[g.categoria] + '22' }]}>
                <Text style={styles.cardEmoji}>{CATEGORIA_EMOJI[g.categoria]}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardNombre} numberOfLines={1}>{g.nombre}</Text>
                <Text style={styles.cardMeta}>{g.fecha} · {g.cuenta}</Text>
                <View style={styles.cardTag}>
                  <Text style={[styles.cardTagText, { color: CATEGORIA_COLORS[g.categoria] }]}>{g.categoria}</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardValor}>{sym}{fmt(g.valor)}</Text>
                <TouchableOpacity onPress={() => handleToggle(g)} style={[styles.pagadoBtn, g.pagado && styles.pagadoBtnActive]}>
                  <Text style={[styles.pagadoBtnText, { color: g.pagado ? colors.green : colors.muted }]}>
                    {g.pagado ? '✓' : '○'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(g)}>
                  <Text style={styles.deleteBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.bg },
  header:      { padding: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  headerSub:   { fontSize: 12, color: colors.muted, marginTop: 2 },
  filterRow:   { maxHeight: 44, marginBottom: 4 },
  filterPill:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.border },
  filterPillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterText:  { fontSize: 11, fontWeight: '500', color: colors.muted },
  filterTextActive: { color: '#fff' },
  filterDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: 4 },
  statsRow:    { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  statPill:    { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statText:    { fontSize: 11, fontWeight: '500' },
  list:        { flex: 1, paddingHorizontal: 16 },
  empty:       { color: colors.muted, fontSize: 13, textAlign: 'center', paddingVertical: 40 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg2,
    borderRadius: 14, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border, gap: 10,
  },
  cardIcon:    { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardEmoji:   { fontSize: 18 },
  cardInfo:    { flex: 1 },
  cardNombre:  { fontSize: 13, fontWeight: '500', color: colors.text, marginBottom: 2 },
  cardMeta:    { fontSize: 11, color: colors.muted, marginBottom: 4 },
  cardTag:     { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: colors.bg3 },
  cardTagText: { fontSize: 10, fontWeight: '600' },
  cardRight:   { alignItems: 'flex-end', gap: 4 },
  cardValor:   { fontSize: 14, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  pagadoBtn:   { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: colors.border2, alignItems: 'center', justifyContent: 'center' },
  pagadoBtnActive: { borderColor: colors.green, backgroundColor: 'rgba(43,191,179,0.15)' },
  pagadoBtnText: { fontSize: 12, fontWeight: '700' },
  deleteBtn:   { fontSize: 14, color: colors.red, padding: 2 },
})
