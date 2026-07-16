import { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { sendChat } from '../../lib/api'
import { colors } from '../../lib/theme'

const STORAGE_KEY = 'financito_chat_history'
const MAX_MESSAGES = 50

const QUICK_COMMANDS = [
  '¿Cuánto gasté este mes?',
  'Top 5 gastos del mes',
  '¿Cuánto tengo pendiente?',
]

interface Message {
  role: 'user' | 'assistant'
  content: string
  imageUri?: string
}

const DEFAULT: Message = {
  role: 'assistant',
  content: '¡Hola! Podés preguntarme sobre tus gastos o subir una foto de un ticket 📸',
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([DEFAULT])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [imageB64, setImageB64] = useState<string | null>(null)
  const [imageMime, setImageMime] = useState<string | null>(null)
  const scrollRef = useRef<ScrollView>(null)

  // Load history
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed)
        } catch {}
      }
    })
  }, [])

  // Save history
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)))
  }, [messages])

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
  }, [messages, loading])

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    })
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      setImageUri(asset.uri)
      setImageB64(asset.base64 ?? null)
      setImageMime(asset.mimeType ?? 'image/jpeg')
    }
  }

  async function send(overrideText?: string) {
    const text = (overrideText ?? input).trim()
    if (!text && !imageB64) return
    setLoading(true)

    const userMsg: Message = {
      role: 'user',
      content: text || 'Analizá este ticket.',
      imageUri: imageUri ?? undefined,
    }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setImageUri(null)

    const b64 = imageB64
    const mime = imageMime
    setImageB64(null)
    setImageMime(null)

    try {
      const data = await sendChat(
        newMessages.map(m => ({ role: m.role, content: m.content })),
        b64 ?? undefined,
        mime ?? undefined,
      )
      setMessages(prev => [...prev, { role: 'assistant', content: data.message ?? 'Error al procesar.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error al conectar con el agente.' }])
    } finally {
      setLoading(false)
    }
  }

  function clearHistory() {
    setMessages([DEFAULT])
    AsyncStorage.removeItem(STORAGE_KEY)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Text style={{ fontSize: 16 }}>✦</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Agente financiero</Text>
          <Text style={styles.headerSub}>
            {messages.length > 1 ? `${messages.length - 1} mensajes` : 'Consultá o subí un ticket'}
          </Text>
        </View>
        {messages.length > 1 && (
          <TouchableOpacity onPress={clearHistory} style={styles.clearBtn}>
            <Text style={styles.clearText}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m, i) => (
            <View key={i} style={{ alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <View style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
                {m.imageUri && (
                  <Image source={{ uri: m.imageUri }} style={styles.bubbleImage} />
                )}
                <Text style={[styles.bubbleText, m.role === 'user' && styles.bubbleTextUser]}>
                  {m.content}
                </Text>
              </View>
            </View>
          ))}
          {loading && (
            <View style={{ alignItems: 'flex-start' }}>
              <View style={styles.bubbleAssistant}>
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick commands */}
        {messages.length <= 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            {QUICK_COMMANDS.map(cmd => (
              <TouchableOpacity key={cmd} onPress={() => send(cmd)} style={styles.quickPill}>
                <Text style={styles.quickText}>{cmd}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Image preview */}
        {imageUri && (
          <View style={styles.previewRow}>
            <Image source={{ uri: imageUri }} style={styles.preview} />
            <Text style={styles.previewText}>Ticket listo para analizar</Text>
            <TouchableOpacity onPress={() => { setImageUri(null); setImageB64(null) }}>
              <Text style={styles.previewRemove}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TouchableOpacity onPress={pickImage} style={[styles.iconBtn, imageUri ? styles.iconBtnActive : null]}>
            <Text style={{ fontSize: 18 }}>📎</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Preguntá algo..."
            placeholderTextColor={colors.muted}
            multiline
            maxLength={500}
            onSubmitEditing={() => send()}
          />
          <TouchableOpacity
            onPress={() => send()}
            disabled={loading || (!input.trim() && !imageB64)}
            style={[styles.sendBtn, (loading || (!input.trim() && !imageB64)) && styles.sendBtnDisabled]}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.bg2,
  },
  headerIcon: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  headerSub:   { fontSize: 11, color: colors.muted },
  clearBtn:    { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
  clearText:   { fontSize: 11, color: colors.muted },
  messages:    { flex: 1 },
  bubble: {
    maxWidth: '85%', borderRadius: 16, padding: 12,
  },
  bubbleUser:      { backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  bubbleAssistant: { backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  bubbleText:      { fontSize: 13, lineHeight: 20, color: colors.text },
  bubbleTextUser:  { color: '#fff' },
  bubbleImage:     { width: 180, height: 120, borderRadius: 8, marginBottom: 8 },
  quickRow:        { maxHeight: 44, marginBottom: 8 },
  quickPill: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, backgroundColor: colors.bg3,
    borderWidth: 1, borderColor: colors.border2,
  },
  quickText:   { fontSize: 12, color: colors.muted },
  previewRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 8, gap: 10,
  },
  preview:       { width: 48, height: 48, borderRadius: 8 },
  previewText:   { flex: 1, fontSize: 12, color: colors.muted },
  previewRemove: { fontSize: 16, color: colors.red, padding: 4 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: 12, gap: 8,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.border2,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  input: {
    flex: 1, backgroundColor: colors.bg3,
    borderWidth: 1, borderColor: colors.border2,
    borderRadius: 10, padding: 10,
    fontSize: 13, color: colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon:    { fontSize: 18, color: '#fff', fontWeight: '700' },
})
