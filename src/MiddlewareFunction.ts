import {MiddlewareExitCode} from "./MiddlewareExitCode";
import {NextRequest} from "next/server";

export type MiddlewareFunction = (req?: NextRequest) => Promise<MiddlewareExitCode> | Promise<void>