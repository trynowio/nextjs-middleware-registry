process.env.ENVIRONMENT = 'test'

const baseConfig = {
    moduleNameMapper: {
        '@tests/(.*)': '<rootDir>/src/tests/$1',
    },
    roots: ['src'],
};

const unitConfig = {
  testRegex: ['/*.spec.*$'],
  ...baseConfig,
}

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  ...unitConfig
}
