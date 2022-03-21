const assert = require('assert').strict
const { SymboleReader, SymboleToken, Rule, ASTStep, LLAnalyser } = require('../commonjs/LLAnalyser')

describe('LLAnalyser Tests', () => {
    describe("Symboles, Terminals and Rules setup", () => {
        it('Should not throw an error when adding twice the same terminal', () => {
            let lla = new LLAnalyser()
            lla.addTerminal('a', 'a')
        })
        it('Should not throw an error when add two rule with the same non-terminak', () => {
            let lla = new LLAnalyser()
            lla.addRule(new Rule('A', ['a'], () => { }))
            lla.addRule(new Rule('A', ['b'], () => { }))
        })
        it('Should throw an error when adding a terminal already used as a nonterminal inside a rule', () => {
            let lla = new LLAnalyser()
            lla.addRule(new Rule('A', [], () => { }))
            assert.throws(() => {
                lla.addTerminal('A')
            })
        })
        it('Should throw an error when adding a rule with a non-terminal already used as a terminal', () => {
            let lla = new LLAnalyser()
            lla.addTerminal('A')
            assert.throws(() => {
                lla.addRule(new Rule('A', [], () => { }))
            })
        })
    })
    describe("Token parsing", () => {
        it('Should not throw an error when the input is of length zero', () => {
            let lla = new LLAnalyser()
            lla.getSymboleTokens('')
        })
        it('Should not throw an error when the input is missing', () => {
            let lla = new LLAnalyser()
            lla.getSymboleTokens()
        })
        it('Should have an eof at then end', () => {
            let lla = new LLAnalyser()
            let result = lla.getSymboleTokens('')
            assert.equal(result[result.length - 1].type, 'EOF')
        })
        it('Should throw an error when unknown characters is found', () => {
            let lla = new LLAnalyser()

            assert.throws(() => {
                lla.getSymboleTokens('abc')
            })
        })
        it('Should ignore null tokens', () => {
            let lla = new LLAnalyser()
            lla.addSymboleReader(new SymboleReader(/\n/, _ => null))

            let result = lla.getSymboleTokens('\n')
            assert.equal(result.length, 1)
            assert.equal(result[0].type, 'EOF')

        })
        it('Should not throw an error when all characters are found and result should be correct', () => {
            let lla = new LLAnalyser()
            lla.addSymboleReader(new SymboleReader(/\n/, _ => null))
            lla.addSymboleReader(new SymboleReader(/[ab]/))
            lla.addSymboleReader(new SymboleReader(/c+/, str => new SymboleToken('c', str)))

            let result = lla.getSymboleTokens('acb\ncc')

            assert.equal(result.length, 5)
            assert.equal(result[0].type, 'a')
            assert.equal(result[0].value, 'a')
            assert.equal(result[1].type, 'c')
            assert.equal(result[1].value, 'c')
            assert.equal(result[2].type, 'b')
            assert.equal(result[2].value, 'b')
            assert.equal(result[3].type, 'c')
            assert.equal(result[3].value, 'cc')
            assert.equal(result[4].type, 'EOF')

        })
    })
    describe('Custom parsing function', () => {
        it('Should parse number "12.5e-6" with floatWithExponent SymboleReader', () => {
            let sr = LLAnalyser.floatWithExponent('nbr')

            let ok = sr.regex.exec('12.5e-6')
            assert.notEqual(ok, null)
        })
        it('Should be able to parse "a" with idString SymboleReader', () => {
            let sr = LLAnalyser.idString('nbr')

            let ok = sr.regex.exec('a')
            assert.notEqual(ok, null)
        })
        it('Should be able to parse "a_" with idString SymboleReader', () => {
            let sr = LLAnalyser.idString('nbr')

            let ok = sr.regex.exec('a_')
            assert.notEqual(ok, null)
        })
        it('Should be able to parse "a0_0De7_456totoBA" with idString SymboleReader', () => {
            let sr = LLAnalyser.idString('nbr')

            let ok = sr.regex.exec('a0_0De7_456totoBA')
            assert.notEqual(ok, null)
        })
        it('Should be able to parse "mySimpleCamelCaseIDN1" with idString SymboleReader', () => {
            let sr = LLAnalyser.idString('nbr')

            let ok = sr.regex.exec('mySimpleCamelCaseIDN1')
            assert.notEqual(ok, null)
        })
        it('Should be able to parse "my_simple_snake_case_id_n_1" with idString SymboleReader', () => {
            let sr = LLAnalyser.idString('nbr')

            let ok = sr.regex.exec('my_simple_snake_case_id_n_1')
            assert.notEqual(ok, null)
        })
    })
})