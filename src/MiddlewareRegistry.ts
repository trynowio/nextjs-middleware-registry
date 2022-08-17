import {pathToRegexp} from "path-to-regexp";
import {NextRequest} from "next/server";
import {MiddlewareExitCode} from "./MiddlewareExitCode";
import {MiddlewareConfig} from "./MiddlewareConfig";
import {MiddlewareFunction} from "./MiddlewareFunction";

export class MiddlewareRegistry {
  private registry: Map<string, MiddlewareConfig> = new Map()
  private readonly request: NextRequest

  constructor(request: NextRequest) {
    this.request = request
  }

  /**
   * Adds a middleware entry to the registry using the provided inputs.
   * @param route Route to attempt to match against.
   * @param middleware Middleware function to run if the route is a match.
   * @param config Extra parameters to configure the entry
   */
  public add(route: string, middleware: MiddlewareFunction | MiddlewareFunction[], config?: Omit<MiddlewareConfig, 'middleware'>) {
    this.registry.set(route, { ...config, middleware: middleware })
  }

  /**
   * Executes the middleware on the request if any matches have been found.
   */
  public async execute() {
    const middlewareChain = this.composeMiddlewareChain()
    let middlewareExitCode: MiddlewareExitCode = MiddlewareExitCode.NEXT
    let middlewareFunction = middlewareChain.next()
    do {
      middlewareExitCode = await middlewareFunction.value() || MiddlewareExitCode.NEXT
      middlewareFunction = middlewareChain.next()
    } while (middlewareExitCode !== MiddlewareExitCode.EXIT )
  }

  private *composeMiddlewareChain(): Generator<MiddlewareFunction, MiddlewareFunction, undefined> {
    for (const [path, config] of this.registry) {
      if (
        pathToRegexp(path).test(this.request.nextUrl.pathname) &&
        (!config.methods || config.methods?.includes(this.request.method))
      ) {
        Array.isArray(config.middleware) ? yield* config.middleware : yield config.middleware
        if (!config.transparent) return async () => MiddlewareExitCode.EXIT
      }
    }
    return async () => MiddlewareExitCode.EXIT
  }
}