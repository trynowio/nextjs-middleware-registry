import { Middleware } from './Middleware'

export interface MiddlewareConfig {
  middleware: Middleware | Middleware[]
  methods?: string[]
  transparent?: boolean
}
