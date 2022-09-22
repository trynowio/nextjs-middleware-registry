import { NextRequest } from "next/server";
import { NextApiRequest } from "next";

export type MiddlewareRequest = NextRequest | NextApiRequest;
