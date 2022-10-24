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
  afterEach(() => {
    jest.restoreAllMocks()
  })

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

  it.each([{ methods: ['GET'] }, undefined, { methods: ['GET', 'POST'] }])(
    'should log a warning for duplicate entries when debug is false',
    async (config) => {
      // GIVEN a request to API endpoint A, and 2 middlewares applied to the same route
      const request = { url: '/api/a' } as NextApiRequest
      const registry = new MiddlewareRegistry(request)
      const consoleWarnSpy = jest.spyOn(console, 'warn')

      expect(registry['registry'].size).toEqual(0)

      // WHEN endpoints A and B are added, and registry is executed
      registry.add('/api/a', TestClass.configure(), config)
      registry.add('/api/a', TestClass.configure(), config)

      // EXPECT a warning to be logged and the registry should only have one entry
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      expect(registry['registry'].size).toEqual(1)
    }
  )

  it('should not log a warning for duplicate entries when debug is true', async () => {
    // GIVEN a request to API endpoint A, and 2 middlewares applied to the same route
    const request = { url: '/api/a' } as NextApiRequest
    const registry = new MiddlewareRegistry(request)
    const consoleWarnSpy = jest.spyOn(console, 'warn')

    // WHEN endpoints A and B are added, and registry is executed
    registry.add('/api/a', TestClass.configure(), null, true)
    registry.add('/api/a', TestClass.configure(), null, true)

    // EXPECT nothing to be logged
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })
})
