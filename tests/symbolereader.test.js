const assert = require('assert').strict
const { SymboleReader, SymboleToken, Rule, ASTStep, LLAnalyser } = require('../commonjs/LLAnalyser')

describe('Symbole Reader Tests', () => {
    it('Should not match if not at the begining of the string', () => {
        let symboleReader = new SymboleReader(/abc/)

        assert.doesNotMatch(' abc', symboleReader.regex)
    })
    it('Should match if at the begining of the string', () => {
        let symboleReader = new SymboleReader(/abc/)

        assert.match('abc ', symboleReader.regex)
    })
    it('Should have a default tokenGenerator function', () => {
        let symboleReader = new SymboleReader(/abc/)

        let symboleToken = symboleReader.tokenGenerator('abc')

        assert.equal(symboleToken.type, 'abc')
        assert.equal(symboleToken.value, 'abc')
    })
    it('Should be able to generate custom token using custom tokenGenerator function', () => {
        let symboleReader = new SymboleReader(/abc/, str => new SymboleToken('a', 'b'))

        let symboleToken = symboleReader.tokenGenerator('abc')

        assert.equal(symboleToken.type, 'a')
        assert.equal(symboleToken.value, 'b')

    })
})