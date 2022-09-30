import { MiddlewareRegistry } from "../MiddlewareRegistry";
import { NextApiRequest } from "next";

describe('MiddlewareConfig.methods', () => {
    it('should execute middleware for specified Http verb provided', async () => {
        const request = { url: '/api/a', method: 'GET' } as NextApiRequest;
        const registry = new MiddlewareRegistry(request);
        // GIVEN route /api/a using two different middlewares
        const middlewareA = jest.fn();
        const middlewareB = jest.fn();
        registry.add('/api/a', middlewareA, { methods: ['GET'] });
        registry.add('/api/a', middlewareB, { methods: ['POST'] });

        // WHEN executed
        await registry.execute();

        // EXPECT middleware associated with specified Http verb is executed
        expect(middlewareA).toHaveBeenCalled();
        expect(middlewareB).not.toHaveBeenCalled();
    });
});