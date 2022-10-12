import { MiddlewareRegistry } from '../MiddlewareRegistry'
import { NextApiRequest } from 'next'
import { Middleware } from '../Middleware'
import { MiddlewareExitCode } from '../MiddlewareExitCode'

class TestClass extends Middleware {
  async middleware() {
    return MiddlewareExitCode.NEXT_IN_CHAIN
  }
}

describe('MiddlewareRegistry.add', () => {
  it('should run middlewares for added endpoints', async () => {
    // GIVEN a request to API endpoint A, and 2 middlewares A and B
    const request = { url: '/api/a' } as NextApiRequest
    const registry = new MiddlewareRegistry(request)
    const middlewareA = TestClass.configure()
    const middlewareB = TestClass.configure()

    jest.spyOn(middlewareA, 'middleware')
    jest.spyOn(middlewareB, 'middleware')

    expect(registry['registry'].size).toEqual(0)

    // WHEN endpoints A and B are added, and registry is executed
    registry.add('/api/a', middlewareA)
    registry.add('/api/b', middlewareB)
    await registry.execute()

    // EXPECT middleware A to have executed, and not middleware B
    expect(middlewareA.middleware).toHaveBeenCalledTimes(1)
    expect(middlewareB.middleware).not.toHaveBeenCalled()
    expect(registry['registry'].size).toEqual(2)
  })
})
