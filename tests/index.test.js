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
})