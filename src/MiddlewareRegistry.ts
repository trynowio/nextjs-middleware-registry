import {pathToRegexp} from "path-to-regexp";
import {NextRequest} from "next/server";

type MiddlewareFunction = () => Promise<Response | void>

interface MiddlewareConfig {
  middleware: MiddlewareFunction
  methods?: string[]
  transparent?: boolean
}

export class MiddlewareRegistry {
  private registry: Map<string, MiddlewareConfig> = new Map()
  private request: NextRequest

  constructor(request: NextRequest) {
    this.request = request
  }

  public add(route: string, middlewareFunction: MiddlewareFunction, config?: Omit<MiddlewareConfig, 'middleware'>) {
    this.registry.set(route, { ...config, middleware: middlewareFunction })
  }

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