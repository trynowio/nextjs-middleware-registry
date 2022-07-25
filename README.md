As of NextJS version 12.2.0 middleware gained official support. However the implementation left a lot to be desired in especially in the sense of building a large, robust set of middlewares that could conditionally be applied to routes and HTTP methods. This project aims to simplify the process of extending the NextJS middleware infrastructure by adding a helper class that allows a registry of middleware to be built and executed on matching routes as requests are made.

##Problems We are Trying to Solve
1. Readability: The current solution requires many `if` blocks to accomplish the application of large sets of middleware.
2. Simplicity: As stated in the previous point, if you want to conditionally run middleware, you need to add the conditional logic inline. This solution aims to give a primary matching algorithm with a few levers for customization.
3. Granular Route/Method Matching: The provided `matcher` configuration provides only a single high-level filter to be used for the entire set of middleware and does not assist in the application of middleware to specific routes. This solution aims to give more granularity to the selection of routes to apply different middleware.

## Getting Started
### Instantiating the Registry
The first thing we need to do is instantiate the registry within the NextJS-provided middleware function. This will give us a registry to add middleware entries to.
```typescript
import { NextRequest } from 'next/server'
import { MiddlewareRegistry } from 'nextjs-middlware-registry'

export async function middleware(req: NextRequest) {
  const registry = new MiddlewareRegistry(req)
}
```

### Adding Middleware Entries
Once we have a registry, we need to add our entries to it to start matching and executing middlewares on different routes. This is where we will define the conditions that need to be met in order for middlewares to be run on specific routes. We can do this by utilizing the `add()` method on the registry.
```typescript
import { NextRequest } from 'next/server'
import { MiddlewareRegistry } from 'nextjs-middlware-registry'

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
import { MiddlewareRegistry } from 'nextjs-middlware-registry'

export async function middleware(req: NextRequest) {
  const registry = new MiddlewareRegistry(req)
    
  registry.add('/api/users', checkAuth)
  registry.add('/api/orders', checkAuth)  

  await registry.execute()
}
```

##Matching Routes
###Default Matching Behavior
This library uses a very simple top-down first-match algorithm with a few caveats. The first route that is matched when looking for middleware to be applied will stop the matching process and execute the middlewares that have been matched to that point.

### Transparent Matching
In some instances there may be a need for applying multiple middlewares to a route without bringing the matching process to a halt. For example, you may want to use middleware to log every request that the server recieves but still perform downstream security operations to authenticate/authorize the user for that specific route. This can be accomplished using a transparent entry.
```typescript
import { NextRequest } from 'next/server'
import { MiddlewareRegistry } from 'nextjs-middlware-registry'

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

### Middleware Function
Middleware functions should be async functions that have a `NextRequest` as their only parameter. Upon execution the request will be injected into the function upon being run.

```typescript
import { NextRequest } from "next/server";

export async function logRequest(req: NextRequest) {
  console.log({ msg: "request_started", path: req.nextUrl.pathname, method: req.nextUrl.method })
}
```

### Configurable Middleware Function
In some cases you may need more configurability in the function you provide for your middleware. In these cases you can call a function that returns a `MiddlewareFunction`.

### Method Matching
If you need more granularity than just the route to match on, you may also match based on the HTTP method used to make the request. These matches will take use the same top-down first-match algorithm to determine whether a route is a match.
```typescript
import { NextRequest } from 'next/server'
import { MiddlewareRegistry } from 'nextjs-middlware-registry'

export async function middleware(req: NextRequest) {
  const registry = new MiddlewareRegistry(req)
  // Log all requests transparently
  registry.add('/:path*', logRequest, { transparent: true })
  // Continue with the standard list of non-transparent middlewares.
  registry.add('/api/users', checkAuth({ scope: 'users_get' }), { method: ['GET']})  
  registry.add('/api/users', checkAuth({ scope: 'users_update' }), { method: ['PUT', 'POST', 'DELETE']})
  registry.add('/api/orders', checkAuth)  

  await registry.execute()
}
```

#Contribution
We welcome all contribution with a few guidelines. If you are contributing in the form of an MR, please be thoughtful in
your communication about the context of the MR, the problem it solves, and any change management required for anyone
upgrading to the new version. All MRs will be reviewed and either approved and merged or declined with comments as to
why it was declined.

###Local Development
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