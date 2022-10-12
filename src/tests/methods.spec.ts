import { MiddlewareRegistry } from '../MiddlewareRegistry'
import { NextApiRequest } from 'next'
import { Middleware } from '../Middleware'
import { MiddlewareExitCode } from '../MiddlewareExitCode'

class TestClass extends Middleware {
  async middleware() {
    return MiddlewareExitCode.NEXT_IN_CHAIN
  }
}

describe('MiddlewareConfig.methods', () => {
  it('should execute middleware for specified Http verb provided', async () => {
    const request = { url: '/api/a', method: 'GET' } as NextApiRequest
    const registry = new MiddlewareRegistry(request)

    // GIVEN route /api/a using two different middlewares
    const middlewareA = TestClass.configure()
    const middlewareB = TestClass.configure()

    jest.spyOn(middlewareA, 'middleware')
    jest.spyOn(middlewareB, 'middleware')

    registry.add('/api/a', middlewareA, { methods: ['GET'] })
    registry.add('/api/a', middlewareB, { methods: ['POST'] })

    // WHEN executed
    await registry.execute()

    // EXPECT middleware associated with specified Http verb is executed
    expect(middlewareA.middleware).toHaveBeenCalled()
    expect(middlewareB.middleware).not.toHaveBeenCalled()
  })
})
