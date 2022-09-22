import { MiddlewareRegistry } from "../MiddlewareRegistry";
import { NextApiRequest } from "next";

describe('MiddlewareRegistry.execute', () => {
    it('should run to check configured matches', () => {
        async function middleware(req: NextApiRequest) {
            const request = { url: '/api/a' } as NextApiRequest;
            const registry = new MiddlewareRegistry(request);
            const middlewareA = jest.fn();
            registry.add('/api/a', middlewareA);
            await registry.execute();
            expect(registry.execute()).toHaveBeenCalledTimes(1);
        }
        // expect(execute).toHaveBeenCalledTimes(1);
    });
});

// should not run middleware without execute
// should run middleware with execute