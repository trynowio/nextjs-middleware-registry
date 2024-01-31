import { pathToRegexp } from 'path-to-regexp'
import { NextRequest } from 'next/server'
import { MiddlewareExitCode } from './MiddlewareExitCode'
import { MiddlewareConfig } from './MiddlewareConfig'
import { MiddlewareRequest, MiddlewareResponse } from './MiddlewareRequest'
import { Middleware } from './Middleware'

export class MiddlewareRegistry<R extends MiddlewareRequest> {
  private registry: Map<string, MiddlewareConfig> = new Map()
  private readonly request: R
  private readonly response: MiddlewareResponse

  constructor(request: R, response: MiddlewareResponse) {
    this.request = request
    this.response = response
  }

  /**
   * Utility typeguard to identify NextRequest objects
   * @param request Request to inspect
   */
  public static isNextRequest(request: any): request is NextRequest {
    return !!request.nextUrl
  }

  /**
   * Adds a middleware entry to the registry using the provided inputs.
   *
   * If called multiple times for the same route and HTTP methods, will log a warning and only preserve the last entry
   * to be added. This warning is disabled when debug mode is set to true, as it may be desirable to overwrite an
   * existing entry in the registry during development.
   *
   * @param route Route to attempt to match against.
   * @param middleware Middleware function to run if the route is a match.
   * @param config Extra parameters to configure the entry
   * @param debug Set to true to skip checking the registry for existing entries
   */
  public add(
    route: string,
    middleware: Middleware | Middleware[],
    config?: Omit<MiddlewareConfig, 'middleware'>,
    debug?: boolean
  ) {
    const serializedRegistryKey = this.serializeToRegistryKey(route, config?.methods)
    if (!debug && this.registry.has(serializedRegistryKey))
      console.warn(`Duplicate entry detected for: ${route}. Only the last entry to be added will be preserved.`)
    this.registry.set(serializedRegistryKey, { ...config, middleware })
  }

  /**
   * Executes the middleware chain on the request if any matches have been found.
   */
  public async execute() {
    const middlewareChain = this.composeMiddlewareChain()
    let middlewareExitCode: MiddlewareExitCode = MiddlewareExitCode.NEXT_IN_CHAIN
    let middleware = middlewareChain.next()
    do {
      if (Array.isArray(middleware.value)) {
        middlewareExitCode = (await this.executeMiddlewareArray(middleware.value)) || MiddlewareExitCode.NEXT_IN_CHAIN
        middleware = middlewareChain.next()
      } else {
        middlewareExitCode =
          typeof middleware.value === 'string'
            ? middleware.value
            : (await (middleware.value as Middleware).middleware(this.request, this.response)) ||
              MiddlewareExitCode.NEXT_IN_CHAIN
        middleware = middlewareChain.next()
      }
    } while (middlewareExitCode !== MiddlewareExitCode.EXIT_CHAIN)
  }

  /**
   * Executes the middleware array on the request.
   * @param middlewares Array of middleware functions.
   * @private
   */
  private async executeMiddlewareArray(middlewares: Middleware[]) {
    const middlewareArray = this.composeMiddlewareArray(middlewares)
    let middlewareExitCode: MiddlewareExitCode = MiddlewareExitCode.NEXT_IN_ARRAY
    let middleware = middlewareArray.next()
    do {
      middlewareExitCode =
        typeof middleware.value === 'string'
          ? middleware.value
          : (await (middleware.value as Middleware).middleware(this.request, this.response)) ||
            MiddlewareExitCode.NEXT_IN_ARRAY
      middleware = middlewareArray.next()
    } while (middlewareExitCode === MiddlewareExitCode.NEXT_IN_ARRAY)
    return middlewareExitCode
  }

  /**
   * Generator to iterate through the middleware configuration and find matching
   * route configurations to run middleware against.
   * @private
   */
  private *composeMiddlewareChain(): Generator<Middleware | Middleware[], MiddlewareExitCode> {
    for (const [serializedKey, config] of this.registry) {
      const route = this.deserializeKeyToPath(serializedKey)
      if (
        pathToRegexp(route).test(this.getRequestPath()) &&
        (!config.methods || config.methods?.includes(this.request.method))
      ) {
        yield config.middleware
        if (!config.transparent) return MiddlewareExitCode.EXIT_CHAIN
      }
    }
    // Append an implicit EXIT if none was previously defined.
    return MiddlewareExitCode.EXIT_CHAIN
  }

  private *composeMiddlewareArray(middlewares: Middleware[]): Generator<Middleware, MiddlewareExitCode> {
    for (const middleware of middlewares) {
      yield middleware
    }
    return MiddlewareExitCode.NEXT_IN_CHAIN
  }

  /**
   * Utility method to retrieve the path of the request based on its type. If the
   * request is deemed to be not an instance of NextRequest, NextApiRequest is used
   * as a fallback and the only other option.
   * @private
   */
  private getRequestPath(): string {
    if (MiddlewareRegistry.isNextRequest(this.request)) {
      return this.request.nextUrl.pathname
    }
    return this.request.url.split('?')[0]
  }

  /**
   * Since different middleware may be added for the same route but under different HTTP verbs, a composite key
   * is required for the middleware mapping.
   * @param route Route passed when added to the registry
   * @param methods Methods, if any, to distinguish the entry by
   * @private
   */
  private serializeToRegistryKey(route: string, methods?: MiddlewareConfig['methods']): string {
    return JSON.stringify({ route, methods })
  }

  /**
   * Given a serialized key from the middleware mapping, return the route
   * @param serializedKey The serialized key to parse
   * @private
   */
  private deserializeKeyToPath(serializedKey: string): string {
    return JSON.parse(serializedKey)!.route
  }
}
