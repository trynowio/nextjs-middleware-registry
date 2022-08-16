import {MiddlewareExitCode} from "./MiddlewareExitCode";

export type MiddlewareFunction = () => Promise<MiddlewareExitCode>