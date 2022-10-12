import { MiddlewareRegistry } from '../MiddlewareRegistry'
import { NextApiRequest } from 'next'
import { MiddlewareExitCode } from '../MiddlewareExitCode'
import { Middleware } from '../Middleware'

class TestClass extends Middleware {
  async middleware(): Promise<MiddlewareExitCode> {
    return MiddlewareExitCode.NEXT_IN_ARRAY
  }
}

describe('MiddlewareRegistry.execute', () => {
  it('should not call a middleware before execute', async () => {
    const request = { url: '/api/a' } as NextApiRequest
    const registry = new MiddlewareRegistry(request)

    // GIVEN a middleware and a route /api/a
    const middleware = TestClass.configure()
    jest.spyOn(middleware, 'middleware')

    registry.add('/api/(.*)', middleware, { transparent: true })
    registry.add('/api/a', middleware)
    expect(middleware.middleware).not.toHaveBeenCalled()

    // WHEN the registry is executed
    await registry.execute()

    // EXPECT the middleware to have been called
    expect(middleware.middleware).toHaveBeenCalledTimes(2)
  })

  it('should run all middlewares in the middleware array when none have an exit code', async () => {
    const middleware1 = TestClass.configure()
    const middleware2 = TestClass.configure()
    const middleware3 = TestClass.configure()

    jest.spyOn(middleware1, 'middleware')
    jest.spyOn(middleware2, 'middleware')
    jest.spyOn(middleware3, 'middleware')

    const req = { url: '/api/a/b/c' } as NextApiRequest
    const registry = new MiddlewareRegistry(req)

    registry.add('/api/(.*)', [middleware1, middleware2, middleware3])
    await registry.execute()

    expect(middleware1.middleware).toHaveBeenCalledTimes(1)
    expect(middleware2.middleware).toHaveBeenCalledTimes(1)
    expect(middleware3.middleware).toHaveBeenCalledTimes(1)
  })

  // eslint-disable-next-line max-len
  it('should run all middlewares up until one returns the EXIT_ARRAY exit code and should continue to the next middleware in the chain.', async () => {
    const middleware1 = TestClass.configure()
    const middleware2 = TestClass.configure()
    const middleware3 = TestClass.configure()
    const middleware4 = TestClass.configure()

    jest.spyOn(middleware1, 'middleware')
    jest.spyOn(middleware2, 'middleware').mockReturnValue(Promise.resolve(MiddlewareExitCode.EXIT_ARRAY))
    jest.spyOn(middleware3, 'middleware')
    jest.spyOn(middleware4, 'middleware')

    const req = { url: '/api/a/b/c' } as NextApiRequest
    const registry = new MiddlewareRegistry(req)

    registry.add('/api/(.*)', [middleware1, middleware2, middleware3], { transparent: true })
    registry.add('/api/a/b/c', middleware4)

    await registry.execute()

    expect(middleware1.middleware).toHaveBeenCalledTimes(1)
    expect(middleware2.middleware).toHaveBeenCalledTimes(1)
    expect(middleware3.middleware).not.toHaveBeenCalled()
    expect(middleware4.middleware).toHaveBeenCalledTimes(1)
  })
})
