import { NextRequest, NextResponse } from 'next/server'
import { NextApiRequest, NextApiResponse } from 'next'

export type MiddlewareRequest = NextRequest | NextApiRequest
export type MiddlewareResponse = NextResponse | NextApiResponse
