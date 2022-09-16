export const MiddlewareExitCode = {
    NEXT: 'NEXT',
    EXIT: 'EXIT',
} as const;

export type MiddlewareExitCode = typeof MiddlewareExitCode[keyof typeof MiddlewareExitCode]