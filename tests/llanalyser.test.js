import { describe, it } from 'mocha'
import { SymboleReader, SymboleToken, Rule, ASTStep, LLAnalyser } from '../dist/index.js'
import assert from 'assert/strict'

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
            lla.add_terminal('a', 'a')
        })
        it('Should not throw an error when add two rule with the same non-terminak', () => {
            let lla = new LLAnalyser()
            lla.add_rule(new Rule('A', ['a'], () => { }))
            lla.add_rule(new Rule('A', ['b'], () => { }))
        })
        it('Should throw an error when adding a terminal already used as a nonterminal inside a rule', () => {
            let lla = new LLAnalyser()
            lla.add_rule(new Rule('A', [], () => { }))
            assert.throws(() => {
                lla.add_terminal('A')
            })
        })
        it('Should throw an error when adding a rule with a non-terminal already used as a terminal', () => {
            let lla = new LLAnalyser()
            lla.add_terminal('A')
            assert.throws(() => {
                lla.add_rule(new Rule('A', [], () => { }))
            })
        })
    })
    describe("Token parsing", () => {
        it('Should not throw an error when the input is of length zero', () => {
            let lla = new LLAnalyser()
            lla.get_symbole_tokens('')
        })
        it('Should not throw an error when the input is missing', () => {
            let lla = new LLAnalyser()
            lla.get_symbole_tokens()
        })
        it('Should have an eof at then end', () => {
            let lla = new LLAnalyser()
            let result = lla.get_symbole_tokens('')
            assert.equal(result[result.length - 1].type, 'EOF')
        })
        it('Should throw an error when unknown characters is found', () => {
            let lla = new LLAnalyser()

            assert.throws(() => {
                lla.get_symbole_tokens('abc')
            })
        })
        it('Should ignore null tokens', () => {
            let lla = new LLAnalyser()
            lla.add_symbole_reader(new SymboleReader(/\n/, _ => null))

            let result = lla.get_symbole_tokens('\n')
            assert.equal(result.length, 1)
            assert.equal(result[0].type, 'EOF')

        })
        it('Should not throw an error when all characters are found and result should be correct', () => {
            let lla = new LLAnalyser()
            lla.add_symbole_reader(new SymboleReader(/\n/, _ => null))
            lla.add_symbole_reader(new SymboleReader(/[ab]+/))
            lla.add_symbole_reader(new SymboleReader(/c+/, str => new SymboleToken('c', str)))

            let result = lla.get_symbole_tokens('acbb\ncc')

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
        it('Should parse number "12.5e-6" with float_with_exponent SymboleReader', () => {
            let sr = SymboleReader.float_with_exponent('nbr')

            let ok = sr.regex.exec('12.5e-6')
            assert.notEqual(ok, null)
        })
        it('Should be able to parse "a" with id_string SymboleReader', () => {
            let sr = SymboleReader.id_string('nbr')

            let ok = sr.regex.exec('a')
            assert.notEqual(ok, null)
        })
        it('Should be able to parse "a_" with id_string SymboleReader', () => {
            let sr = SymboleReader.id_string('nbr')

            let ok = sr.regex.exec('a_')
            assert.notEqual(ok, null)
        })
        it('Should be able to parse "a0_0De7_456totoBA" with id_string SymboleReader', () => {
            let sr = SymboleReader.id_string('nbr')

            let ok = sr.regex.exec('a0_0De7_456totoBA')
            assert.notEqual(ok, null)
        })
        it('Should be able to parse "mySimpleCamelCaseIDN1" with id_string SymboleReader', () => {
            let sr = SymboleReader.id_string('nbr')

            let ok = sr.regex.exec('mySimpleCamelCaseIDN1')
            assert.notEqual(ok, null)
        })
        it('Should be able to parse "my_simple_snake_case_id_n_1" with id_string SymboleReader', () => {
            let sr = SymboleReader.id_string('nbr')

            let ok = sr.regex.exec('my_simple_snake_case_id_n_1')
            assert.notEqual(ok, null)
        })
    })
    describe('First of symbole', () => {
        it('Should return epsilon, when only rule is epsilon', () => {
            let lla = new LLAnalyser()
            lla.add_rule(new Rule('S', []))

            let firsts = lla.first('S')
            let expected = new Set([null])
            setsEqual(firsts, expected)

        })
        it('Should return an error when symbole is not known', () => {
            let lla = new LLAnalyser()
            lla.add_rule(new Rule('S', ['a']))

            assert.throws(() => {
                lla.first('S')
            }, /Unknown symbole/)

        })
        it('Should return EOF, when multiple rules are epsilon', () => {
            let lla = new LLAnalyser()
            lla.add_rule(new Rule('S', ['A']))
            lla.add_rule(new Rule('A', ['B']))
            lla.add_rule(new Rule('B', ['C']))
            lla.add_rule(new Rule('C', []))

            let firsts = lla.first('C')
            let expected = new Set([null])
            setsEqual(firsts, expected)

        })
        it('Should return null, when grammar is rigged', () => {
            let lla = new LLAnalyser()
            lla.add_rule(new Rule('S', ['A']))
            lla.add_rule(new Rule('B', ['C']))
            lla.add_rule(new Rule('C', []))

            let firsts = lla.first('C')
            let expected = new Set([null])
            setsEqual(firsts, expected)

        })
        it('Should return first symbole when found', () => {
            let lla = new LLAnalyser()
            lla.add_terminal('a')
            lla.add_rule(new Rule('S', ['a']))


            let firsts = lla.first('S')
            let expected = new Set(['a'])
            setsEqual(firsts, expected)
        })

        it('Should return first of next nonterminals when found', () => {
            let lla = new LLAnalyser()
            lla.add_terminal('a')

            lla.add_rule(new Rule('S', ['A']))
            lla.add_rule(new Rule('A', ['a']))

            let firsts = lla.first('S')
            let expected = new Set(['a'])
            setsEqual(firsts, expected)
        })
        it('Should return first of next multiple nonterminals when found', () => {
            let lla = new LLAnalyser()
            lla.add_terminal('a')

            lla.add_rule(new Rule('S', ['A']))
            lla.add_rule(new Rule('A', ['B']))
            lla.add_rule(new Rule('B', ['C']))
            lla.add_rule(new Rule('C', ['a']))

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

            let at = lla.get_analysis_table()

            assert.equal(Object.keys(at).length, 1)
            assert.equal(Object.keys(at['S']).length, 1)
            assert.equal(at['S']['EOF'], null)
        })
        it('Should fill in with given rules', () => {
            let lla = new LLAnalyser()
            lla.add_terminal('a', 'b')

            lla.add_rule(
                new Rule('S', ['A']),
                new Rule('A', ['a']),
                new Rule('A', ['b']),
            )

            let at = lla.get_analysis_table()

            assert.equal(Object.keys(at).length, 2)
            assert.equal(Object.keys(at['S']).length, 3)
            assert.equal(Object.keys(at['A']).length, 3)
            assert.equal(at['S']['a'], lla.rules['S'][0])
            assert.equal(at['S']['b'], lla.rules['S'][0])
            assert.equal(at['A']['a'], lla.rules['A'][0])
            assert.equal(at['A']['b'], lla.rules['A'][1])
        })
        it('Should throw an error on conflict', () => {
            let lla = new LLAnalyser()
            lla.add_terminal('a')

            lla.add_rule(
                new Rule('S', ['A']),
                new Rule('S', ['B']),
                new Rule('A', ['a']),
                new Rule('B', ['a'])
            )

            assert.throws(() => {
                let at = lla.get_analysis_table()
            }, /AnalysisTable Conflict/)

        })
    })
    describe('Parsing string', () => {
        var lla = new LLAnalyser()
        Rule.default_action = Rule.return_arguments_as_flat_array
        beforeEach(() => {
            lla = new LLAnalyser()
        })

        it('Should return a AST when string is empty and S->epsilon', () => {
            lla.add_rule(new Rule('S', []))
            let result = lla.parse('')
            assert.deepEqual(result, new ASTStep('S'))
        })
        it('Should return null when flattening AST', () => {
            lla.add_rule(new Rule('S', [], _ => null))
            let result = lla.parse('')
            assert.equal(result.flatten(), null)
        })
        it('Should return AST with one levels', () => {
            let lla = new LLAnalyser()
            lla.add_symbole_reader(SymboleReader.id_string('str'))
            lla.add_terminal('str')
            lla.add_rule(new Rule('S', ['str']))
            let result = lla.parse('abc')

            assert.deepEqual(result.flatten(), ['abc'])

        })
        it('Should return AST with multiple levels', () => {
            lla.add_symbole_reader(SymboleReader.skip_spacing())
            lla.add_symbole_reader(SymboleReader.id_string('str'))
            lla.add_terminal('str')
            lla.add_rule(
                new Rule('S', ['A', 'B']),
                new Rule('A', ['str']),
                new Rule('B', ['str'])
            )
            let result = lla.parse('abc def')

            assert.deepEqual(result.flatten(), ['abc', 'def'])
        })
        it('Should read math (2+2)', () => {
            lla.add_symbole_reader(
                new SymboleReader(/[+]/),
                new SymboleReader(/[-]/),
                new SymboleReader(/[*]/),
                new SymboleReader(/[/]/),
                new SymboleReader(/[(]/),
                new SymboleReader(/[)]/),
                SymboleReader.skip_spacing(),
                SymboleReader.skip_carriage_return(),
                SymboleReader.float_with_exponent('nbr'),
            )
            lla.add_terminal('nbr', '+', '-', '*', '/', '(', ')')
            lla.add_rule(
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
            lla.add_symbole_reader(
                new SymboleReader(/[+]/),
                new SymboleReader(/[-]/),
                new SymboleReader(/[*]/),
                new SymboleReader(/[/]/),
                new SymboleReader(/[(]/),
                new SymboleReader(/[)]/),
                SymboleReader.skip_spacing(),
                SymboleReader.skip_carriage_return(),
                SymboleReader.float_with_exponent('nbr'),
            )
            lla.add_terminal('nbr', '+', '-', '*', '/', '(', ')')
            lla.add_rule(
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