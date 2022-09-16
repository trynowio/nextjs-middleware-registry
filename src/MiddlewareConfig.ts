import { MiddlewareFunction } from "./MiddlewareFunction";

export interface MiddlewareConfig {
  middleware: MiddlewareFunction | MiddlewareFunction[]
  methods?: string[]
  transparent?: boolean
}