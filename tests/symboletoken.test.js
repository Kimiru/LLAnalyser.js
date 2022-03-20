const assert = require('assert').strict
const { SymboleReader, SymboleToken, Rule, ASTStep, LLAnalyser } = require('../commonjs/LLAnalyser')

describe('Symbole Token Tests', () => {
    it('Should copy type as value by default', () => {
        let symboleToken = new SymboleToken('abc')

        assert.equal(symboleToken.value, symboleToken.type)
    })
    it('Should be able to have a custom value', () => {
        let symboleToken = new SymboleToken('abc', 5)

        assert.equal(symboleToken.value, 5)
    })
})