const base = require('./jest.config.base')

module.exports = {
  ...base,
  roots: ['<rootDir>'],
  projects: [
    '<rootDir>/packages/sqip',
    '<rootDir>/packages/sqip-cli',
    '<rootDir>/packages/sqip-plugin-blur',
    '<rootDir>/packages/sqip-plugin-data-uri',
    '<rootDir>/packages/sqip-plugin-pixels',
    '<rootDir>/packages/sqip-plugin-potrace',
    '<rootDir>/packages/sqip-plugin-primitive',
    '<rootDir>/packages/sqip-plugin-svgo'
  ]
}
