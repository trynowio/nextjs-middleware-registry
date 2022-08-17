As of NextJS version 12.2.0, middleware gained official support. However, the implementation left a lot to be desired with regard to building a large, robust set of middlewares that could conditionally be applied to a route and furthermore its specific HTTP methods. While all of these things are possible, the methodology for doing so and the suggested patterns don't leave much room for larger scale projects. This package aims to simplify the process of extending the NextJS middleware infrastructure by adding a helper class that allows the construction of a simple registry of middleware that can be run against requests as they are received by the server.

## Problems We are Trying to Solve
1. __Readability__: The current solution requires many `if` blocks to accommodate an application with a large set of middleware. At a certain point, this becomes difficult to scale while maintaining context for the overall logic in place. This package aims to simplify the registration of middlewares into short succinct configuration statements.
2. __Convention over Configuration__: As stated in the previous point, if you want to do much beyond the standard running of a single unit of middleware, you are inundated with decisions and the complexities of implementing those decisions. This solution aims to add a simple convention by providing a primary route matching algorithm with a few levers for customization.
3. __Granular Route/Method Matching__: The provided `matcher` configuration provides only a single high-level filter to be used for the entire set of middleware and does not assist in the application of middleware to specific routes or methods. This solution aims to give more granularity to the selection of routes to apply specific middlewares to.

## Getting Started
### Instantiating the Registry
The first thing we need to do is instantiate the registry within the NextJS-provided middleware function. This will give us a registry to add middleware entries to.
```typescript
import { NextRequest } from 'next/server'
import { MiddlewareRegistry } from 'nextjs-middleware-registry'

export async function middleware(req: NextRequest) {
  const registry = new MiddlewareRegistry(req)
}
```

### Adding Middleware Entries
Once we have a registry, we need to add our entries to it to start matching and executing middlewares on different routes. This is where we will define the conditions that need to be met in order for middlewares to be run on specific routes. We can do this by utilizing the `add()` method on the registry.
```typescript
import { NextRequest } from 'next/server'
import { MiddlewareRegistry } from 'nextjs-middleware-registry'

export async function middleware(req: NextRequest) {
  const registry = new MiddlewareRegistry(req)
    
  registry.add('/api/users', checkAuth)
  registry.add('/api/orders', checkAuth)
}
```

### Executing the Middleware
The final step in the process, now that we have our complete registry of middleware is to execute the request against the registry and see if there is any middlewares that need to be run against the request based on the configured matchers. This is done by simply calling the `execute()` method on the registry.
```typescript
import { NextRequest } from 'next/server'
import { MiddlewareRegistry } from 'nextjs-middleware-registry'

export async function middleware(req: NextRequest) {
  const registry = new MiddlewareRegistry(req)
    
  registry.add('/api/users', checkAuth)
  registry.add('/api/orders', checkAuth)  

  await registry.execute()
}
```

## Matching Routes
The library uses the path-to-regexp project to assist in the matching of paths to entries within the registry. This provides a succinct and well documented syntax to create match-strings against, while also providing a robust and customizable match mechanism.

For more information we suggest reading the docs: [path-to-regexp](https://www.npmjs.com/package/path-to-regexp)

### Default Matching Behavior
This library uses a very simple top-down first-match algorithm with a few caveats. The first route that is matched when looking for middleware to be applied will stop the matching process and execute the middlewares that have been matched to that point. Worth noting is that the route configurations are stored within a `Map` with the match-path of the configuration as the key. This effectively preventing accidental or intentional double-entry of a route configuration and forces the developer to reconcile the configuration and encourages simplicity over complexity. While the library will not present errors regarding a double entry, only the last entry will be recorded within the resulting `Map`.

### Transparent Matching
There may be a need for applying multiple middlewares to a route without bringing the matching process to a halt. For example, you may want to use middleware to log every request that the server receives but still perform downstream security operations to authenticate/authorize the user for that specific route. This can be accomplished using a transparent entry.
```typescript
import { NextRequest } from 'next/server'
import { MiddlewareRegistry } from 'nextjs-middleware-registry'

export async function middleware(req: NextRequest) {
  const registry = new MiddlewareRegistry(req)
  // Log all requests transparently
  registry.add('/:path*', logRequest, { transparent: true })
  // Continue with the standard list of non-transparent middlewares.  
  registry.add('/api/users', checkAuth)
  registry.add('/api/orders', checkAuth)  

  await registry.execute()
}
```

### Binding Multiple Middlewares to a Single Route Configuration
It is possible to bind multiple middlewares to a single route configuration within the registry. Given multiple middlewares the system will attempt to run them all in sequence unless the logic internal to the middleware dictates an exit of some kind by returning the `EXIT` Middleware Exit Code. This can be useful in cases where multiple middleware configurations should be applied to the same route to support multiple forms of interaction. For example if your application supports multiple forms of authentication, you may want to support both an API Key flow and a User Session flow with separate middlewares.
```typescript
import { NextRequest } from 'next/server'
import { MiddlewareRegistry } from 'nextjs-middleware-registry'

export async function middleware(req: NextRequest) {
  const registry = new MiddlewareRegistry(req)
  // Allow this endpoint to use both an API Key or a standard Auth Session  
  registry.add('/api/users', [checkApiKey, checkAuth])
  registry.add('/api/orders', checkAuth)  

  await registry.execute()
}
```


### Middleware Function
Middleware functions should be async functions that have an optional `NextRequest` as their only parameter. Upon execution the request will be injected into the function upon being run as a parameter. Middleware functions should return a `MiddlewareExitCode` but don't necessarily have to as `PROCEED` is implied at the end of the middleware unless a different exit code is defined within the return.

```typescript
import {NextRequest} from "next/server";
import {MiddlewareExitCode} from "./MiddlewareExitCode";

export async function logRequest(req: NextRequest) {
    console.log({msg: "request_started", path: req.nextUrl.pathname, method: req.nextUrl.method})
    return MiddlewareExitCode.PROCEED
}
```

### Configurable Middleware Function
In some cases you may need more configurability in the function you provide for your middleware. In these cases you can call a function that returns a `MiddlewareFunction`.

### Method Matching
If you need more granularity than just the route to match on, you may also match based on the HTTP method used to make the request. These matches will take use the same top-down first-match algorithm to determine whether a route is a match. By adding a `methods` property to the provided `MiddlewareConfig` you can supply an array of methods you would like to be considered for the specified route.
```typescript
import { NextRequest } from 'next/server'
import { MiddlewareRegistry } from 'nextjs-middleware-registry'

export async function middleware(req: NextRequest) {
  const registry = new MiddlewareRegistry(req)
  // Log all requests transparently
  registry.add('/:path*', logRequest, { transparent: true })
  // Continue with the standard list of non-transparent middlewares.
  registry.add('/api/users', checkAuth({ scope: 'users_get' }), { methods: ['GET']})  
  registry.add('/api/users', checkAuth({ scope: 'users_update' }), { methods: ['PUT', 'POST', 'DELETE']})
  registry.add('/api/orders', checkAuth)  

  await registry.execute()
}
```

# Contribution
We welcome all contribution with a few guidelines. If you are contributing in the form of an MR, please be thoughtful in
your communication about the context of the MR, the problem it solves, and any change management required for anyone
upgrading to the new version. All MRs will be reviewed and either approved and merged or declined with comments as to
why it was declined.

### Local Development
The easiest way to make changes is to make use of `npm link` to proxy the dependency on this package to your local
instance of the project/build. This method will allow you to directly see your changes in a project that you have
context for.

1. From the root of the `nextjs-middleware-registry` run the `npm link` command.
```shell
npm link
```
2. From the root of your own project that uses `nextjs-middleware-registry` as a dependency run:
```shell
npm link nextjs-middleware-registry
```

From here you can run `npm run watch` to rebuild the project as you make changes.