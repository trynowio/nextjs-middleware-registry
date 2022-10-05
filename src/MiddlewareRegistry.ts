import { pathToRegexp } from 'path-to-regexp'
import { NextRequest } from 'next/server'
import { MiddlewareExitCode } from './MiddlewareExitCode'
import { MiddlewareConfig } from './MiddlewareConfig'
import { MiddlewareFunction } from './MiddlewareFunction'
import { MiddlewareRequest } from './MiddlewareRequest'

export class MiddlewareRegistry<R extends MiddlewareRequest> {
  private registry: Map<string, MiddlewareConfig> = new Map()
  private readonly request: R

  constructor(request: R) {
    this.request = request
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
   * @param route Route to attempt to match against.
   * @param middleware Middleware function to run if the route is a match.
   * @param config Extra parameters to configure the entry
   */
  public add(
    route: string,
    middleware: MiddlewareFunction | MiddlewareFunction[],
    config?: Omit<MiddlewareConfig, 'middleware'>
  ) {
    this.registry.set(this.serializeToRegistryKey(route, config?.methods), { ...config, middleware })
  }

  /**
   * Executes the middleware chain on the request if any matches have been found.
   */
  public async execute() {
    const middlewareChain = this.composeMiddlewareChain()
    let middlewareExitCode: MiddlewareExitCode = MiddlewareExitCode.NEXT_IN_CHAIN
    let middlewareFunction = middlewareChain.next()
    do {
      if (Array.isArray(middlewareFunction.value)) {
        middlewareExitCode =
          (await this.executeMiddlewareArray(middlewareFunction.value)) || MiddlewareExitCode.NEXT_IN_CHAIN
        middlewareFunction = middlewareChain.next()
      } else {
        middlewareExitCode =
          (await (middlewareFunction.value as MiddlewareFunction)(this.request)) || MiddlewareExitCode.NEXT_IN_CHAIN
        middlewareFunction = middlewareChain.next()
      }
    } while (middlewareExitCode !== MiddlewareExitCode.EXIT_CHAIN)
  }

  /**
   * Executes the middleware array on the request.
   * @param middlewareFunctionArray Array of middleware functions.
   * @private
   */
  private async executeMiddlewareArray(middlewareFunctionArray: MiddlewareFunction[]) {
    const middlewareArrayGenerator = this.composeMiddlewareArray(middlewareFunctionArray)
    let middlewareExitCode: MiddlewareExitCode = MiddlewareExitCode.NEXT_IN_ARRAY
    let middlewareFunction = middlewareArrayGenerator.next()
    do {
      middlewareExitCode = (await middlewareFunction.value(this.request)) || MiddlewareExitCode.NEXT_IN_ARRAY
      middlewareFunction = middlewareArrayGenerator.next()
    } while (middlewareExitCode === MiddlewareExitCode.NEXT_IN_ARRAY)
    return middlewareExitCode
  }

  /**
   * Generator to iterate through the middleware configuration and find matching
   * route configurations to run middleware against.
   * @private
   */
  private *composeMiddlewareChain(): Generator<
    MiddlewareFunction | MiddlewareFunction[],
    MiddlewareFunction,
    undefined
  > {
    for (const [serializedKey, config] of this.registry) {
      const route = this.deserializeKeyToPath(serializedKey)
      if (
        pathToRegexp(route).test(this.getRequestPath()) &&
        (!config.methods || config.methods?.includes(this.request.method))
      ) {
        yield config.middleware
        if (!config.transparent) return async () => MiddlewareExitCode.EXIT_CHAIN
      }
    }
    // Append an implicit EXIT if none was previously defined.
    return async () => MiddlewareExitCode.EXIT_CHAIN
  }

  private *composeMiddlewareArray(
    middlewareFunctionArray: MiddlewareFunction[]
  ): Generator<MiddlewareFunction, MiddlewareFunction, undefined> {
    for (const middlewareFunction of middlewareFunctionArray) {
      yield middlewareFunction
    }
    return async () => MiddlewareExitCode.NEXT_IN_CHAIN
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
