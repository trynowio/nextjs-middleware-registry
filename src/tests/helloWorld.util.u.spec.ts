function helloWorld() {
  return 'Hello World'
}

describe('helloWorld', () => {
  it('should return helloWorld', () => {
    const result = helloWorld()

    expect(result).toEqual('Hello World')
  })
})
