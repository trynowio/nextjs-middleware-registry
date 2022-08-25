import { pathToRegexp } from "path-to-regexp";
import { NextRequest } from "next/server";
import { MiddlewareExitCode } from "./MiddlewareExitCode";
import { MiddlewareConfig } from "./MiddlewareConfig";
import { MiddlewareFunction } from "./MiddlewareFunction";
import { NextApiRequest } from "next";
import { MiddlewareRequest } from "./MiddlewareRequest";

export class MiddlewareRegistry<R extends MiddlewareRequest> {
    private registry: Map<string, MiddlewareConfig> = new Map();
    private readonly request: R;

    constructor(request: R) {
        this.request = request;
    }

    /**
   * Utility typeguard to identify NextRequest objects
   * @param request Request to inspect
   */
    public static isNextRequest(request: any): request is NextRequest {
        return !!request.nextUrl;
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
        this.registry.set(route, { ...config, middleware: middleware });
    }

    /**
   * Executes the middleware chain on the request if any matches have been found.
   */
    public async execute() {
        const middlewareChain = this.composeMiddlewareChain();
        let middlewareExitCode: MiddlewareExitCode = MiddlewareExitCode.NEXT;
        let middlewareFunction = middlewareChain.next();
        do {
            middlewareExitCode = await middlewareFunction.value(this.request) || MiddlewareExitCode.NEXT;
            middlewareFunction = middlewareChain.next();
        } while (middlewareExitCode !== MiddlewareExitCode.EXIT );
    }

    /**
   * Generator to iterate through the middleware configuration and find matching
   * route configurations to run middleware against.
   * @private
   */
    private *composeMiddlewareChain(): Generator<MiddlewareFunction, MiddlewareFunction, undefined> {
        for (const [path, config] of this.registry) {
            if (
                pathToRegexp(path).test(this.getRequestPath()) &&
        (!config.methods || config.methods?.includes(this.request.method))
            ) {
                Array.isArray(config.middleware) ? yield* config.middleware : yield config.middleware;
                if (!config.transparent) return async () => MiddlewareExitCode.EXIT;
            }
        }
        // Append an implicit EXIT if none was previously defined.
        return async () => MiddlewareExitCode.EXIT;
    }

    /**
   * Utility method to retrieve the path of the request based on its type. If the
   * request is deemed to be not an instance of NextRequest, NextApiRequest is used
   * as a fallback and the only other option.
   * @private
   */
    private getRequestPath(): string {
        if (MiddlewareRegistry.isNextRequest(this.request)){
            return this.request.nextUrl.pathname;
        } 
        return (this.request as NextApiRequest).url;
    
    }
}