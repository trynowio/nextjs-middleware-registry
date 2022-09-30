import { MiddlewareRegistry } from '../MiddlewareRegistry'
import { NextApiRequest } from 'next'

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
})
