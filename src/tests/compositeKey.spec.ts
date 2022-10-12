import { NextApiRequest } from 'next'
import { MiddlewareRegistry } from '../MiddlewareRegistry'
import { shuffle } from './utils/shuffle'
import { Middleware } from '../Middleware'
import { MiddlewareExitCode } from '../MiddlewareExitCode'

class TestClass extends Middleware {
  async middleware() {
    return MiddlewareExitCode.NEXT_IN_CHAIN
  }
}

describe('compositeKey', () => {
  it.each(Array.from(new Array(10)))(
    'should execute middlewares no matter what order they are added in, randomized run %#',
    async () => {
      // GIVEN a GET request to an endpoint with different middlewares for each verb, added in a random sequence
      const request = { url: '/api/a', method: 'GET' } as NextApiRequest
      const registry = new MiddlewareRegistry(request)
      const middlewareA = TestClass.configure()
      const middlewareB = TestClass.configure()
      const middlewareC = TestClass.configure()
      const middlewareD = TestClass.configure()

      jest.spyOn(middlewareA, 'middleware')
      jest.spyOn(middlewareB, 'middleware')
      jest.spyOn(middlewareC, 'middleware')
      jest.spyOn(middlewareD, 'middleware')

      const randomizedAdditions = shuffle([
        () => {
          registry.add('/api/a', middlewareC, { methods: ['DELETE'] })
        },
        () => {
          registry.add('/api/a', middlewareA, { methods: ['GET'] })
        },
        () => {
          registry.add('/api/a', middlewareB, { methods: ['POST'] })
        },
        () => {
          registry.add('/api/a', middlewareD, { methods: ['PUT'] })
        },
      ])

      randomizedAdditions.forEach((addToRegistry) => addToRegistry())

      // WHEN executed
      await registry.execute()

      // EXPECT only the GET middleware to have been called
      expect(middlewareA.middleware).toHaveBeenCalledTimes(1)
      expect(middlewareB.middleware).not.toHaveBeenCalled()
      expect(middlewareC.middleware).not.toHaveBeenCalled()
      expect(middlewareD.middleware).not.toHaveBeenCalled()
    }
  )
})
