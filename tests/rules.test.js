const assert = require('assert').strict
const { SymboleReader, SymboleToken, Rule, ASTStep, LLAnalyser } = require('../commonjs/LLAnalyser')

describe('Rule Tests', () => {
    it('Should have a default action function return all parameter as an object', () => {
        let rule = new Rule('A', [])
        let res = rule.action('A', 'B', 'C')

        assert.equal(res[0], 'A')
        assert.equal(res[1], 'B')
        assert.equal(res[2], 'C')
    })
    it('Should be able to register custom action', () => {
        let rule = new Rule('B', [], (a, b, c) => [a])
        let res = rule.action('A', 'B', 'C')

        assert.equal(res[0], 'A')
        assert.equal(res[1], undefined)
        assert.equal(res[2], undefined)
    })
})