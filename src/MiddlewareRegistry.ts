import {pathToRegexp} from "path-to-regexp";
import {NextRequest} from "next/server";

type MiddlewareFunction = () => Promise<Response | void>

interface MiddlewareConfig {
  middleware: MiddlewareFunction
  methods?: string[]
  transparent?: boolean
}

export class MiddlewareRegistry {
  // Maps maintain their order of insertion which is critical to the registry operating as expected.
  private registry: Map<string, MiddlewareConfig> = new Map()
  private request: NextRequest

  constructor(request: NextRequest) {
    this.request = request
  }

  /**
   * Adds a middleware entry to the registry using the provided inputs.
   * @param route Route to attempt to match against.
   * @param middlewareFunction Middleware function to run if the route is a match.
   * @param config Extra parameters to configure the entry
   */
  public add(route: string, middlewareFunction: MiddlewareFunction, config?: Omit<MiddlewareConfig, 'middleware'>) {
    this.registry.set(route, { ...config, middleware: middlewareFunction })
  }

  /**
   * Executes the middleware on the request if any matches have been found.
   */
  public async execute() {
    const middlewares = []
    for (const [path, config] of this.registry) {
      if (
        pathToRegexp(path).test(this.request.nextUrl.pathname) &&
        (!config.methods || config.methods?.includes(this.request.method))
      ) {
        middlewares.push(config.middleware)
        if (!config.transparent) break
      }
    }

    for (const middlewareFunction of middlewares) {
      await middlewareFunction()
    }
  }
}