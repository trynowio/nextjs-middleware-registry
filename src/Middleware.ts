import { MiddlewareExitCode } from './MiddlewareExitCode'
import { MiddlewareRequest, MiddlewareResponse } from './MiddlewareRequest'

export abstract class Middleware<O = any> {
  private readonly _options: O
  public get options() {
    return this._options
  }

  constructor(options?: O) {
    this._options = options
  }

  public abstract middleware(req: MiddlewareRequest, res: MiddlewareResponse): Promise<MiddlewareExitCode | void>
  public static configure<O, T extends Middleware>(this: new (options?: O) => T, options?: O): T {
    return new this(options)
  }
}
