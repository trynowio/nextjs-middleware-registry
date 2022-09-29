import { NextApiRequest } from "next";
import { MiddlewareRegistry } from "../MiddlewareRegistry";

describe('query strings', () => {
    it('should not include query strings when matching a request', async () => {
        // GIVEN a request to a path /a with middleware A, which includes a query string
        const request = { url: '/api/a?test=123' } as NextApiRequest;
        const registry = new MiddlewareRegistry(request);
        const middlewareA = jest.fn();
        registry.add('/api/a', middlewareA);

        // WHEN executed
        await registry.execute();

        // EXPECT middleware to run regardless of query string
        expect(middlewareA).toHaveBeenCalledTimes(1);
    });
});