import { MiddlewareExitCode } from "./MiddlewareExitCode";
import { MiddlewareRequest } from "./MiddlewareRequest";

export type MiddlewareFunction = (
  req?: MiddlewareRequest
) => Promise<MiddlewareExitCode> | Promise<void>;
