import helloWorld from '../function'

describe('helloWorld', () => {
    it('should return helloWorld', () => {
        const result = helloWorld()

        expect(result).toEqual('Hello World')
    })
})