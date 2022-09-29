import { MiddlewareRegistry } from "../MiddlewareRegistry";
import { NextApiRequest } from "next";

describe('MiddlewareConfig.transparent', () => {
    it(
        'should execute multiple middlewares for the matched route when transparent is true and stop when false',
        async () => {
            // GIVEN 3 middlewares A, B, and C all added with transparent config
            const request = { url: '/api/a' } as NextApiRequest;
            const registry = new MiddlewareRegistry(request);
            const middlewareA = jest.fn();
            const middlewareB = jest.fn();
            const middlewareC = jest.fn();
            registry.add('/api/(.*)', middlewareA, { transparent: true });
            registry.add('/api/a', middlewareB, { transparent: true });
            registry.add('(.*)/api/a', middlewareC, { transparent: true });

            // WHEN executed
            await registry.execute();

            // EXPECT all middlewares to run
            expect(middlewareA).toHaveBeenCalledTimes(1);
            expect(middlewareB).toHaveBeenCalledTimes(1);
            expect(middlewareC).toHaveBeenCalledTimes(1);
        });

    it(
        'should only execute the first middleware for the matched route when after the first false transparent config',
        async ()=> {
            // GIVEN 3 middlewares A, B, and C, with middleware B non-transparent
            const request = { url: '/api/a' } as NextApiRequest;
            const registry = new MiddlewareRegistry(request);
            const middlewareA = jest.fn();
            const middlewareB = jest.fn();
            const middlewareC = jest.fn();
            registry.add('/api/(.*)', middlewareA, { transparent: true });
            registry.add('/api/a', middlewareB, { transparent: false });
            registry.add('(.*)/api/a', middlewareC, { transparent: true });

            // WHEN executed
            await registry.execute();

            // EXPECT middlewares added before the first non-transparent middleware to run
            expect(middlewareA).toHaveBeenCalledTimes(1);
            expect(middlewareB).toHaveBeenCalledTimes(1);
            expect(middlewareC).not.toHaveBeenCalled();
        });
});