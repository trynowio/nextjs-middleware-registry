import { MiddlewareRegistry } from "../MiddlewareRegistry";
import { NextApiRequest } from "next";

describe('MiddlewareRegistry.methods', () => {
    it('should add the methods specified to the registry when provided and all ' +
        'standard methods otherwise', async () => {
        const request = { url: '/api/a' } as NextApiRequest;
        const registry = new MiddlewareRegistry(request);
        // GIVEN a middleware A
        const middlewareA = jest.fn();
        // GIVEN three routes /api/a, /api/b, api/c with varying methods passed to the config
        registry.add('/api/a', middlewareA, { methods: ['GET'] });
        registry.add('/api/b', middlewareA, { methods: ['GET', 'POST'] });
        registry.add('/api/c', middlewareA);

        // WHEN executed
        await registry.execute();

        // EXPECT /api/a methods to include GET
        expect((registry["registry"].get('/api/a').methods)).toEqual(expect.arrayContaining(['GET']));
        // EXPECT /api/b to include GET and POST
        expect((registry["registry"].get('/api/b').methods)).toEqual(expect.arrayContaining(['GET', 'POST']));
        // EXPECT /api/c methods to be undefined
        expect((registry["registry"].get('/api/c').methods)).toBeUndefined();
    });
});