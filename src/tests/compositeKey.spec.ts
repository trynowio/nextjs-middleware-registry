import { NextApiRequest } from "next";
import { MiddlewareRegistry } from "../MiddlewareRegistry";
import { shuffle } from "../utils/shuffle";

describe('compositeKey', () => {
    it.each(
        Array.from(new Array(10))
    )('should execute middlewares no matter what order they are added in, randomized run %#', async () => {
        // GIVEN a GET request to an endpoint with different middlewares for each verb, added in a random sequence
        const request = { url: '/api/a', method: 'GET' } as NextApiRequest;
        const registry = new MiddlewareRegistry(request);
        const middlewareA = jest.fn();
        const middlewareB = jest.fn();
        const middlewareC = jest.fn();
        const middlewareD = jest.fn();

        const randomizedAdditions = shuffle([() => {
            registry.add('/api/a', middlewareC, { methods: ['DELETE'] });
        },() => {
            registry.add('/api/a', middlewareA, { methods: ['GET'] });

        },() => {
            registry.add('/api/a', middlewareB, { methods: ['POST'] });

        },() => {
            registry.add('/api/a', middlewareD, { methods: ['PUT'] });
        }]);

        randomizedAdditions.forEach((addToRegistry) => addToRegistry());

        // WHEN executed
        await registry.execute();

        // EXPECT only the GET middleware to have been called
        expect(middlewareA).toHaveBeenCalledTimes(1);
        expect(middlewareB).not.toHaveBeenCalled();
        expect(middlewareC).not.toHaveBeenCalled();
        expect(middlewareD).not.toHaveBeenCalled();
    });
});