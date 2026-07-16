export type Moneda = 'CLP' | 'USD' | 'ARG'
export type Categoria =
  | 'CASAMIENTO' | 'DPTO' | 'SALUD' | 'TARJETAS'
  | 'SERVICIOS'  | 'COMIDA' | 'SUPER' | 'INVERSION'
export type Cuenta = 'BUENBIT' | 'MP ARG' | 'MACH BANK' | 'MP' | 'CMR'

export interface Gasto {
  id: string
  nombre: string
  valor: number
  moneda: Moneda
  categoria: Categoria
  cuenta: Cuenta
  fecha: string
  pagado: boolean
}

export interface GastoInput {
  nombre: string
  valor: number
  moneda: Moneda
  categoria: Categoria
  cuenta: Cuenta
  fecha: string
  pagado: boolean
}

export const CATEGORIAS: Categoria[] = [
  'CASAMIENTO','DPTO','SALUD','TARJETAS',
  'SERVICIOS','COMIDA','SUPER','INVERSION',
]
export const CUENTAS: Cuenta[] = ['BUENBIT','MP ARG','MACH BANK','MP','CMR']
export const MONEDAS: Moneda[] = ['CLP','USD','ARG']

export const CATEGORIA_COLORS: Record<Categoria, string> = {
  CASAMIENTO: '#e57373', DPTO:      '#64b5f6',
  SALUD:      '#81c784', TARJETAS:  '#ffb74d',
  SERVICIOS:  '#ba68c8', COMIDA:    '#f06292',
  SUPER:      '#4db6ac', INVERSION: '#aed581',
}

export const CATEGORIA_EMOJI: Record<Categoria, string> = {
  CASAMIENTO: '💍', DPTO:      '🏠',
  SALUD:      '❤️', TARJETAS:  '💳',
  SERVICIOS:  '⚡', COMIDA:    '🍽️',
  SUPER:      '🛒', INVERSION: '📈',
}

export const MONEDA_SYMBOL: Record<Moneda, string> = {
  CLP: '$', USD: 'US$', ARG: 'AR$',
}
