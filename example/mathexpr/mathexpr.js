const { SymboleReader, SymboleToken, Rule, ASTStep, LLAnalyser } = require('../../commonjs/LLAnalyser')

let lla = new LLAnalyser()

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
    new Rule('S', ['E'], e => e),

    new Rule('E', ['T', 'Ep'], (t, ep) => {
        if (ep === null) return t // no sum => return subtree part
        return { op: 'o+o', value: [t, ...ep] } // sum => combine subtree into sum
    }),
    new Rule('Ep', ['+', 'T', 'Ep'], (_, t, ep) => { // binary plus operator
        if (ep === null) return [t] // no subsum => return sum list
        return [t, ...ep] // subsum => combine sumlist
    }),
    new Rule('Ep', ['-', 'T', 'Ep'], (_, t, ep) => { // binary minus operator => cheat, use uniary minus as suboperator into calculus
        if (ep === null) return [{ op: '-o', value: t }] // no subsum => return sum list
        return [{ op: '-o', value: t }, ...ep] // subsum => combine sumlist
    }),
    new Rule('Ep', []), // Epsilon -> no value

    new Rule('T', ['F', 'Tp'], (f, tp) => {
        if (tp === null) return f
        return { op: 'o*o', value: [f, ...tp] }
    }),
    new Rule('Tp', ['*', 'F', 'Tp'], (_, f, tp) => {
        if (tp === null) return [f]
        return [f, ...tp]
    }), // binary mult operator
    new Rule('Tp', ['/', 'F', 'Tp'], (_, f, tp) => {
        if (tp === null) return [{ op: '1/x', value: f }]
        return [{ op: '1/x', value: f }, ...tp]
    }), // binary div operator => cheat, use invert as suboperator (1/x)
    new Rule('Tp', [], _ => null), // Epsilon -> no value

    new Rule('F', ['nbr'], o => ({ op: 'nbr', value: o })), // number terminal
    new Rule('F', ['-', 'F'], (_, f) => ({ op: '-o', value: f })), // unary minus operator
    new Rule('F', ['(', 'E', ')'], (_, e) => e), // Return sub tree
)

function calculate(branch = { op: '', value: null }) {
    if (branch.op === 'nbr') return branch.value
    else if (branch.op === '-o') return -calculate(branch.value)
    else if (branch.op === '1/x') return 1 / calculate(branch.value)
    else if (branch.op === 'o+o') return branch.value.reduce((res, val) => res + calculate(val), 0)
    else if (branch.op === 'o*o') return branch.value.reduce((res, val) => res * calculate(val), 1)
}

module.exports = { mathexpr_lla: lla, calculate }