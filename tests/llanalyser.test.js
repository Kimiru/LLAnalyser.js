const assert = require('assert').strict
const { SymboleReader, SymboleToken, Rule, ASTStep, LLAnalyser } = require('../commonjs/LLAnalyser')

/**
 * 
 * @param {Set<string} s1 
 * @param {Set<string>} s2 
 */
function setsEqual(s1, s2) {
    if (s1.size != s2.size) {
        assert.fail(`Received Set(${s1.size}) { ${[...s1].map(e => "'" + e + "'").join(', ')} } Expected  Set(${s2.size}) { ${[...s2].map(e => "'" + e + "'").join(', ')} }`)
    }
    for (let value of s1) {
        if (!s2.has(value)) {
            return assert.fail(`Received Set(${s1.size}) { ${[...s1].map(e => "'" + e + "'").join(', ')} } Expected  Set(${s2.size}) { ${[...s2].map(e => "'" + e + "'").join(', ')} }`)


        }
    }
}

Rule.defaultAction = Rule.flat

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
            lla.addSymboleReader(new SymboleReader(/[ab]+/))
            lla.addSymboleReader(new SymboleReader(/c+/, str => new SymboleToken('c', str)))

            let result = lla.getSymboleTokens('acbb\ncc')

            assert.equal(result.length, 5)
            assert.equal(result[0].type, 'a')
            assert.equal(result[0].value, 'a')
            assert.equal(result[1].type, 'c')
            assert.equal(result[1].value, 'c')
            assert.equal(result[2].type, 'bb')
            assert.equal(result[2].value, 'bb')
            assert.equal(result[3].type, 'c')
            assert.equal(result[3].value, 'cc')
            assert.equal(result[4].type, 'EOF')

        })
    })
    describe('Custom parsing function', () => {
        it('Should parse number "12.5e-6" with floatWithExponent SymboleReader', () => {
            let sr = SymboleReader.floatWithExponent('nbr')

            let ok = sr.regex.exec('12.5e-6')
            assert.notEqual(ok, null)
        })
        it('Should be able to parse "a" with idString SymboleReader', () => {
            let sr = SymboleReader.idString('nbr')

            let ok = sr.regex.exec('a')
            assert.notEqual(ok, null)
        })
        it('Should be able to parse "a_" with idString SymboleReader', () => {
            let sr = SymboleReader.idString('nbr')

            let ok = sr.regex.exec('a_')
            assert.notEqual(ok, null)
        })
        it('Should be able to parse "a0_0De7_456totoBA" with idString SymboleReader', () => {
            let sr = SymboleReader.idString('nbr')

            let ok = sr.regex.exec('a0_0De7_456totoBA')
            assert.notEqual(ok, null)
        })
        it('Should be able to parse "mySimpleCamelCaseIDN1" with idString SymboleReader', () => {
            let sr = SymboleReader.idString('nbr')

            let ok = sr.regex.exec('mySimpleCamelCaseIDN1')
            assert.notEqual(ok, null)
        })
        it('Should be able to parse "my_simple_snake_case_id_n_1" with idString SymboleReader', () => {
            let sr = SymboleReader.idString('nbr')

            let ok = sr.regex.exec('my_simple_snake_case_id_n_1')
            assert.notEqual(ok, null)
        })
    })
    describe('First of symbole', () => {
        it('Should return epsilon, when only rule is epsilon', () => {
            let lla = new LLAnalyser()
            lla.addRule(new Rule('S', []))

            let firsts = lla.first('S')
            let expected = new Set([null])
            setsEqual(firsts, expected)

        })
        it('Should return an error when symbole is not known', () => {
            let lla = new LLAnalyser()
            lla.addRule(new Rule('S', ['a']))

            assert.throws(() => {
                lla.first('S')
            }, /Unknown symbole/)

        })
        it('Should return EOF, when multiple rules are epsilon', () => {
            let lla = new LLAnalyser()
            lla.addRule(new Rule('S', ['A']))
            lla.addRule(new Rule('A', ['B']))
            lla.addRule(new Rule('B', ['C']))
            lla.addRule(new Rule('C', []))

            let firsts = lla.first('C')
            let expected = new Set([null])
            setsEqual(firsts, expected)

        })
        it('Should return null, when grammar is rigged', () => {
            let lla = new LLAnalyser()
            lla.addRule(new Rule('S', ['A']))
            lla.addRule(new Rule('B', ['C']))
            lla.addRule(new Rule('C', []))

            let firsts = lla.first('C')
            let expected = new Set([null])
            setsEqual(firsts, expected)

        })
        it('Should return first symbole when found', () => {
            let lla = new LLAnalyser()
            lla.addTerminal('a')

            lla.addRule(new Rule('S', ['a']))

            let firsts = lla.first('S')
            let expected = new Set(['a'])
            setsEqual(firsts, expected)
        })

        it('Should return first of next nonterminals when found', () => {
            let lla = new LLAnalyser()
            lla.addTerminal('a')

            lla.addRule(new Rule('S', ['A']))
            lla.addRule(new Rule('A', ['a']))

            let firsts = lla.first('S')
            let expected = new Set(['a'])
            setsEqual(firsts, expected)
        })
        it('Should return first of next multiple nonterminals when found', () => {
            let lla = new LLAnalyser()
            lla.addTerminal('a')

            lla.addRule(new Rule('S', ['A']))
            lla.addRule(new Rule('A', ['B']))
            lla.addRule(new Rule('B', ['C']))
            lla.addRule(new Rule('C', ['a']))

            let firsts = lla.first('S')
            let expected = new Set(['a'])
            setsEqual(firsts, expected)
        })
    })
    describe('Follow of symbole', () => {
        it('Should return EOF with grammat root S', () => {
            let lla = new LLAnalyser()

            let follows = lla.follow('S')
            setsEqual(follows, new Set(['EOF']))
        })
        it('Shoud throw an error when symbole is not known', () => {
            let lla = new LLAnalyser()

            assert.throws(() => {
                let follows = lla.follow('A')
            })
        })
    })
    describe('Analysis table', () => {
        it('Should be empty when no rules', () => {
            let lla = new LLAnalyser()

            let at = lla.getAnalysisTable()

            assert.equal(at.size, 1)
            assert.equal(at.get('S').size, 1)
            assert.equal(at.get('S').get('EOF'), null)
        })
        it('Should fill in with given rules', () => {
            let lla = new LLAnalyser()
            lla.addTerminal('a', 'b')

            lla.addRule(
                new Rule('S', ['A']),
                new Rule('A', ['a']),
                new Rule('A', ['b']),
            )

            let at = lla.getAnalysisTable()

            assert.equal(at.size, 2)
            assert.equal(at.get('S').size, 3)
            assert.equal(at.get('A').size, 3)
            assert.equal(at.get('S').get('a'), lla.rules.get('S')[0])
            assert.equal(at.get('S').get('b'), lla.rules.get('S')[0])
            assert.equal(at.get('A').get('a'), lla.rules.get('A')[0])
            assert.equal(at.get('A').get('b'), lla.rules.get('A')[1])
        })
        it('Should throw an error on conflict', () => {
            let lla = new LLAnalyser()
            lla.addTerminal('a')

            lla.addRule(
                new Rule('S', ['A']),
                new Rule('S', ['B']),
                new Rule('A', ['a']),
                new Rule('B', ['a'])
            )

            assert.throws(() => {
                let at = lla.getAnalysisTable()
            }, /AnalysisTable Conflict/)

        })
    })
    describe('Parsing string', () => {
        var lla = new LLAnalyser()
        beforeEach(() => {
            lla = new LLAnalyser()
        })

        it('Should return a AST when string is empty and S->epsilon', () => {
            lla.addRule(new Rule('S', []))
            let result = lla.parse('')
            assert.deepEqual(result, new ASTStep('S'))
        })
        it('Should return null when flattening AST', () => {
            lla.addRule(new Rule('S', [], _ => null))
            let result = lla.parse('')
            assert.equal(result.flatten(), null)
        })
        it('Should return AST with one levels', () => {
            let lla = new LLAnalyser()
            lla.addSymboleReader(SymboleReader.idString('str'))
            lla.addTerminal('str')
            lla.addRule(new Rule('S', ['str']))
            let result = lla.parse('abc')

            assert.deepEqual(result.flatten(), ['abc'])

        })
        it('Should return AST with multiple levels', () => {
            lla.addSymboleReader(SymboleReader.skipSpacing())
            lla.addSymboleReader(SymboleReader.idString('str'))
            lla.addTerminal('str')
            lla.addRule(
                new Rule('S', ['A', 'B']),
                new Rule('A', ['str']),
                new Rule('B', ['str'])
            )
            let result = lla.parse('abc def')

            assert.deepEqual(result.flatten(), ['abc', 'def'])
        })
        it('Should read math (2+2)', () => {
            lla.addSymboleReader(
                new SymboleReader(/[+]/),
                new SymboleReader(/[-]/),
                new SymboleReader(/[*]/),
                new SymboleReader(/[/]/),
                new SymboleReader(/[(]/),
                new SymboleReader(/[)]/),
                SymboleReader.skipSpacing(),
                SymboleReader.skipCarriageReturn(),
                SymboleReader.floatWithExponent('nbr'),
            )
            lla.addTerminal('nbr', '+', '-', '*', '/', '(', ')')
            lla.addRule(
                new Rule('S', ['E']),

                new Rule('E', ['T', 'Ep']),
                new Rule('Ep', ['+', 'T', 'Ep']),
                new Rule('Ep', ['-', 'T', 'Ep']),
                new Rule('Ep', []),

                new Rule('T', ['F', 'Tp']),
                new Rule('Tp', ['*', 'F', 'Tp']),
                new Rule('Tp', ['/', 'F', 'Tp']),
                new Rule('Tp', []),

                new Rule('F', ['nbr']),
                new Rule('F', ['(', 'E', ')']),
            )
            let ast = lla.parse('(2+2)')

            assert.deepEqual(ast.flatten(), ['(', 2, '+', 2, ')'])
        })
        it('Should read math 2*(2-4)/4+2', () => {
            lla.addSymboleReader(
                new SymboleReader(/[+]/),
                new SymboleReader(/[-]/),
                new SymboleReader(/[*]/),
                new SymboleReader(/[/]/),
                new SymboleReader(/[(]/),
                new SymboleReader(/[)]/),
                SymboleReader.skipSpacing(),
                SymboleReader.skipCarriageReturn(),
                SymboleReader.floatWithExponent('nbr'),
            )
            lla.addTerminal('nbr', '+', '-', '*', '/', '(', ')')
            lla.addRule(
                new Rule('S', ['E']),

                new Rule('E', ['T', 'Ep']),
                new Rule('Ep', ['+', 'T', 'Ep']),
                new Rule('Ep', ['-', 'T', 'Ep']),
                new Rule('Ep', []),

                new Rule('T', ['F', 'Tp']),
                new Rule('Tp', ['*', 'F', 'Tp']),
                new Rule('Tp', ['/', 'F', 'Tp']),
                new Rule('Tp', []),

                new Rule('F', ['nbr']),
                new Rule('F', ['(', 'E', ')']),
            )
            let ast = lla.parse('2*(2-4)/4+2')

            assert.deepEqual(ast.flatten(), [2, '*', '(', 2, '-', 4, ')', '/', 4, '+', 2])
        })
    })
})