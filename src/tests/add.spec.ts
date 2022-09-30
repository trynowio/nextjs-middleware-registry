import { MiddlewareRegistry } from '../MiddlewareRegistry'
import { NextApiRequest } from 'next'

describe('MiddlewareRegistry.add', () => {
  it('should run middlewares for added endpoints', async () => {
    // GIVEN a request to API endpoint A, and 2 middlewares A and B
    const request = { url: '/api/a' } as NextApiRequest
    const registry = new MiddlewareRegistry(request)
    const middlewareA = jest.fn()
    const middlewareB = jest.fn()

    expect(registry['registry'].size).toEqual(0)

    // WHEN endpoints A and B are added, and registry is executed
    registry.add('/api/a', middlewareA)
    registry.add('/api/b', middlewareB)
    await registry.execute()

    // EXPECT middleware A to have executed, and not middleware B
    expect(middlewareA).toHaveBeenCalledTimes(1)
    expect(middlewareB).not.toHaveBeenCalled()
    expect(registry['registry'].size).toEqual(2)
  })
})
