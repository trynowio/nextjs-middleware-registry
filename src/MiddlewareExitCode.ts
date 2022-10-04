export const MiddlewareExitCode = {
  NEXT_IN_ARRAY: 'NEXT_IN_ARRAY',
  NEXT_IN_CHAIN: 'NEXT_IN_CHAIN',
  EXIT_ARRAY: 'EXIT_ARRAY',
  EXIT_CHAIN: 'EXIT_CHAIN',
} as const

export type MiddlewareExitCode = typeof MiddlewareExitCode[keyof typeof MiddlewareExitCode]
