import { MiddlewareRegistry } from '../MiddlewareRegistry'
import { NextApiRequest } from 'next'
import { MiddlewareExitCode } from "../MiddlewareExitCode";

describe('MiddlewareRegistry.execute', () => {
  it('should not call a middleware before execute', async () => {
    const request = { url: '/api/a' } as NextApiRequest
    const registry = new MiddlewareRegistry(request)

    // GIVEN a middleware and a route /api/a
    const middleware = jest.fn()
    registry.add('/api/(.*)', middleware, { transparent: true })
    registry.add('/api/a', middleware)
    expect(middleware).not.toHaveBeenCalled()

    // WHEN the registry is executed
    await registry.execute()

    // EXPECT the middleware to have been called
    expect(middleware).toHaveBeenCalledTimes(2)
  })

  it('should run all middlewares in the middleware array when none have an exit code', async () => {
    const middleware1 = jest.fn()
    const middleware2 = jest.fn()
    const middleware3 = jest.fn()

    const req = { url: '/api/a/b/c' } as NextApiRequest
    const registry = new MiddlewareRegistry(req)

    registry.add('/api/(.*)', [middleware1, middleware2, middleware3])
    await registry.execute()

    expect(middleware1).toHaveBeenCalledTimes(1)
    expect(middleware2).toHaveBeenCalledTimes(1)
    expect(middleware3).toHaveBeenCalledTimes(1)
  })

  // eslint-disable-next-line max-len
  it('should run all middlewares up until one returns the EXIT_ARRAY exit code and should continue to the next middleware in the chain.', async () => {
    const middleware1 = jest.fn()
    const middleware2 = jest.fn().mockReturnValue(Promise.resolve(MiddlewareExitCode.EXIT_ARRAY))
    const middleware3 = jest.fn()
    const middleware4 = jest.fn()

    const req = { url: '/api/a/b/c' } as NextApiRequest
    const registry = new MiddlewareRegistry(req)

    registry.add('/api/(.*)', [middleware1, middleware2, middleware3], { transparent: true })
    registry.add('/api/a/b/c', middleware4)

    await registry.execute()

    expect(middleware1).toHaveBeenCalledTimes(1)
    expect(middleware2).toHaveBeenCalledTimes(1)
    expect(middleware3).not.toHaveBeenCalled()
    expect(middleware4).toHaveBeenCalledTimes(1)
  })
})
