/**
 * CONST
 */

/**
 * VAR
 */

/**
 * CLASSES
 */



/**
 * SymboleToken
 * 
 * an object containing the type of the symbole read and its associated value
 * ex:  
 *      type: 'if'  value: 'if'
 *      type: 'nbr' value: 5
 *      type: 'id'  value: 'index'
 */
class SymboleToken {

    type: string
    value: any
    line: number
    column: number

    /**
     * Create a token with an type and a value
     * If the value is undefined, the type will serv as value
     * 
     * @param {string} type 
     * @param {any} value 
     */
    constructor(type: string, value: any = undefined) {
        this.type = type
        if (value === undefined) this.value = type
        else this.value = value

        this.line = this.column = 0
    }
}


/**
 * SymboleReader
 * 
 * An object containing the regex used to readd a given symbole and the function used to generate a token
 */
class SymboleReader {

    regex: RegExp
    tokenGenerator: (string) => SymboleToken

    /**
     * 
     * @param {RegExp} regex 
     * @param {str => new SymboleToken(str)} tokenGenerator 
     */
    constructor(regex: RegExp, tokenGenerator: (string) => SymboleToken = str => new SymboleToken(str)) {
        this.regex = new RegExp('^' + regex.source)
        this.tokenGenerator = tokenGenerator
    }


    /**
     * UTILITIES
     */

    static skipCarriageReturn() { return new SymboleReader(/\n/, _ => null) }

    static skipSpacing() { return new SymboleReader(/\s/, _ => null) }

    /**
     * 
     * @param {string} type 
     * @returns 
     */
    static floatWithExponent(type: string): SymboleReader {
        return new SymboleReader(/([-+]?\d*\.?\d+)(?:[eE]([-+]?\d+))?/, str => new SymboleToken(type, Number(str)))
    }

    /**
     * 
     * @param {string} type 
     * @returns 
     */
    static idString(type: string): SymboleReader {
        return new SymboleReader(/[a-zA-Z0-9][_a-zA-Z0-9]*/, str => new SymboleToken(type, str))
    }

}


/**
 * Rule
 * 
 * An object that represent a grammar rule to apply and the action to perform after AST has been calculated
 */
class Rule {

    nonTerminal: string
    symboles: string[]
    action: Function

    static defaultAction = Rule.array

    /**
     * Build a new rule
     * if symboles list is empty, it will be considered as epsilon
     * 
     * @param nonTerminal 
     * @param symboles 
     * @param action 
     */
    constructor(nonTerminal: string, symboles: string[], action: Function = Rule.defaultAction) {
        this.nonTerminal = nonTerminal
        this.symboles = symboles
        this.action = action
    }

    static array(...args) { return args }

    static flat(...args) {
        let result = []
        for (let arg of args) {
            if (arg === null) continue
            if (typeof arg == 'object') result = [...result, ...arg]
            else result.push(arg)
        }
        return result
    }

    toString(): string {

        return this.nonTerminal + ' -> ' + (this.symboles.length ? this.symboles.join(' ') : 'epsilon')
    }

}


/**
 * Abstract Syntax Tree Step
 * 
 * Contains all the information parse by the grammar interpreter, ready to be flattened by the user instructions. 
 */
class ASTStep {

    type: string
    value: any
    token: any
    children: ASTStep[]
    rule: Rule

    constructor(type = '') {

        this.type = type
        this.value = null
        this.children = []
        this.rule = null

    }

    flatten() {

        let args = []

        for (let child of this.children) {
            let flat = child.flatten()
            args.push(flat)
        }

        return this.rule?.action(...args) ?? this.value

    }

}


/**
 * LL(1) Grammar Parser/Analyser
 * 
 * Used to simply create a parser able to read an input with a given grammar and return a custom Abtract syntaxe tree
 */
class LLAnalyser {

    symboleReaders: SymboleReader[]
    terminals: Set<string>
    nonTerminals: Set<string>
    rules: Map<string, Rule[]>

    constructor() {
        this.symboleReaders = []
        this.terminals = new Set()
        this.terminals.add('EOF')
        this.nonTerminals = new Set()
        this.nonTerminals.add('S')

        this.rules = new Map();
        this.rules.set('S', [])
    }

    /**
     * Add a given symbole reader to the analyser
     * 
     * @param {...SymboleReader} symboleReaders 
     */
    addSymboleReader(...symboleReaders: SymboleReader[]): void {
        for (let symboleReader of symboleReaders) {
            this.symboleReaders.push(symboleReader)
        }
    }

    /**
     * Add a given terminal to the anlyser
     * if the terminal was already defined, nothing will happen
     * if the terminal was already defined as a non terminal, it will throw an error
     * 
     * @param {...string} terminals 
     */
    addTerminal(...terminals: string[]): void {
        for (let terminal of terminals) {
            if (this.nonTerminals.has(terminal)) throw new Error(`Conflict: ${terminal} is already a non-terminal`)
            this.terminals.add(terminal)
        }
    }

    /**
     * Add a given rule to the analyser
     * 
     * @param {...Rule} rules 
     */
    addRule(...rules: Rule[]): void {
        for (const rule of rules) {
            if (this.terminals.has(rule.nonTerminal)) throw new Error(`Conflict: ${rule.nonTerminal} is already a terminal`)
            if (!this.nonTerminals.has(rule.nonTerminal)) {
                this.nonTerminals.add(rule.nonTerminal)
                this.rules.set(rule.nonTerminal, [])
            }
            this.rules.get(rule.nonTerminal).push(rule)
        }
    }

    /**
     * 
     * @param {string} input 
     * @returns {SymboleToken[]}
     */
    getSymboleTokens(input: string): SymboleToken[] {

        let tokenList: SymboleToken[] = []

        let lastIndex: number = -1
        let currentIndex: number = 0

        let line: number = 1
        let column: number = 1

        while (input && currentIndex < input.length) {
            if (currentIndex === lastIndex) {
                lastIndex = currentIndex
                currentIndex++
                while (currentIndex < input.length) {
                    let result = this.findToken(input, currentIndex)
                    if (!result) {
                        currentIndex++
                        continue
                    }
                    break
                }

                let unknownPart = input.substring(lastIndex, currentIndex)

                throw new Error(`Cannot progress during tokens splicing, line ${line} column ${column}, unkown character${unknownPart.length > 1 ? 's' : ''}: "${unknownPart}"`)


            }
            lastIndex = currentIndex

            let result = this.findToken(input, currentIndex)
            if (!result) continue

            line += result.lineBreak
            if (result.lineBreak) column = 1
            column += result.column
            currentIndex += result.length

            if (result.symboleToken) {
                result.symboleToken.line = line
                result.symboleToken.column = column
                tokenList.push(result.symboleToken)
            }
        }

        let eof = new SymboleToken('EOF')
        eof.line = line
        eof.column = column
        tokenList.push(eof)
        return tokenList
    }

    private findToken(in_input: string, at_index: number): { symboleToken: SymboleToken, lineBreak: number, column: number, length: number } {
        for (let symboleReader of this.symboleReaders) {
            let str = in_input.substring(at_index)
            let regexExecutionResult = symboleReader.regex.exec(str)
            if (regexExecutionResult) {
                let symboleToken = symboleReader.tokenGenerator(regexExecutionResult[0])
                let lineBreak = 0, column = 0
                for (let char of regexExecutionResult[0]) {
                    if (char == '\n') {
                        lineBreak++
                        column = 0
                    } else
                        column++
                }

                return { symboleToken, lineBreak, column, length: regexExecutionResult[0].length }
            }
        }
        return null
    }

    /**
     * Calculate and return the analysis table of the stored gammar
     * 
     * @returns {Map<string, Map<string, Rule>>}
     */
    getAnalysisTable(): Map<string, Map<string, Rule>> {
        let analysisTable: Map<string, Map<string, Rule>> = new Map()
        for (let nonTerminal of this.nonTerminals) {
            analysisTable.set(nonTerminal, new Map())
            for (let terminal of this.terminals)
                analysisTable.get(nonTerminal).set(terminal, null)
        }

        for (let [_, rules] of this.rules) {
            for (let rule of rules) {
                let firsts: Set<string> = this.first(rule.symboles[0] ?? null)
                for (let terminal of firsts) {
                    if (terminal !== null) {
                        if (analysisTable.get(rule.nonTerminal).get(terminal) === null) {
                            analysisTable.get(rule.nonTerminal).set(terminal, rule)
                        } else
                            throw new Error(`AnalysisTable Conflict: Incompatible rules\n${analysisTable.get(rule.nonTerminal).get(terminal).toString()} firsts: Set { ${[...this.first(analysisTable.get(rule.nonTerminal).get(terminal).symboles[0] ?? null)].join(', ')} }\n${rule.toString()} firsts: Set { ${[...firsts].join(', ')} }\nPlease, check for firsts and follow`)
                    } else {
                        let follows = this.follow(rule.nonTerminal)
                        for (let terminal of follows) {
                            if (analysisTable.get(rule.nonTerminal).get(terminal) === null) {
                                analysisTable.get(rule.nonTerminal).set(terminal, rule)
                            } else
                                throw new Error(`AnalysisTable Conflict: Incompatible rules\n${analysisTable.get(rule.nonTerminal).get(terminal).toString()} firsts: Set { ${[...this.first(analysisTable.get(rule.nonTerminal).get(terminal).symboles[0] ?? null)].join(', ')} }\n${rule.toString()} firsts: Set { ${[...firsts].join(', ')} }\nPlease, check for firsts and follow`)
                        }
                    }
                }

            }
        }

        return analysisTable
    }

    first(s, ignore = new Set<string>()): Set<string> {
        if (ignore.has(s)) return new Set()
        if (s === null) return new Set([null])
        if (this.terminals.has(s)) return new Set([s])
        if (this.nonTerminals.has(s)) {
            ignore.add(s)

            let set: Set<string> = new Set<string>()

            this.rules.get(s).forEach(rule => {
                if (rule.symboles.length) {
                    let firsts = this.first(rule.symboles[0], ignore)
                    firsts.forEach(e => set.add(e))
                }
                else set.add(null)
            })

            if (!set.size) set.add(null)

            return set
        }
        throw new Error(`Unknown symbole: "${s}" it is neither a terminal nor a non-terminal`)
    }

    follow(s, ignore = new Set<string>()): Set<string> {
        if (ignore.has(s)) return new Set()
        if (this.nonTerminals.has(s)) {
            ignore.add(s)
            let set: Set<string> = new Set<string>()
            if (s == 'S') set.add('EOF')

            this.rules.forEach(rules => rules.forEach(rule => {
                if (rule.symboles.includes(s)) {
                    let index = rule.symboles.indexOf(s)

                    while (index < rule.symboles.length - 1) {
                        let firsts = this.first(rule.symboles[index + 1])
                        firsts.forEach(e => { if (e !== null) set.add(e) })
                        if (firsts.has(null)) index++
                        else break
                    }
                    if (index == rule.symboles.length - 1) {
                        let follows = this.follow(rule.nonTerminal, new Set([...ignore]))
                        follows.forEach(e => set.add(e))
                    }
                }
            }))

            return set
        }
        throw new Error(`Unknown symbole: "${s}" it is neither a terminal nor a non-terminal`)
    }

    /**
     * 
     * @param {Rule} rule 
     * @returns {Set<string>}
     */
    firstsOfRule(rule: Rule): Set<string> {

        let terminal: Set<string> = new Set() // Result
        let firsts: Set<string> = new Set() // Nonterminals for which we need to find firsts
        let follow: Set<string> = new Set() // Nonterminals for which we need to find follows
        let ignoreFirst: Set<string> = new Set() // Nonterminals for which we already found firsts
        let ignoreFollow: Set<string> = new Set() // Nonterminals for which we already found follows

        if (rule.symboles.length) // If not epsilon
            if (this.terminals.has(rule.symboles[0])) // If first symbole is a terminal
                terminal.add(rule.symboles[0])
            else // If first symbole is a nonterminal, need to check for its first
                firsts.add(rule.symboles[0])
        else // If epsilon, need to check for follow
            follow.add(rule.nonTerminal)

        while (firsts.size || follow.size) { // If firsts nonterminal or follow of nonterminal need to be treated
            for (let nonTerminal of [...firsts]) {
                firsts.delete(nonTerminal)
                ignoreFirst.add(nonTerminal)

                if (!this.nonTerminals.has(nonTerminal)) throw new Error(`Unknown symbole: "${nonTerminal}" it is neither a terminal nor a non-terminal`)

                for (let rule of this.rules.get(nonTerminal)) { // For each rules of the nonterminal
                    if (rule.symboles.length) { // If not epsilon
                        if (this.terminals.has(rule.symboles[0])) // If first symbole is a terminal
                            terminal.add(rule.symboles[0])
                        else if (!ignoreFirst.has(rule.symboles[0])) // If first symbole is a nonterminal and has not already been handled, need to check for its first
                            firsts.add(rule.symboles[0])
                    } else if (!ignoreFollow.has(nonTerminal)) // If epsilon, need to check for follow and has not already been handled
                        follow.add(nonTerminal)
                }
            }

            for (let nonTerminal of [...follow]) {

                follow.delete(nonTerminal)
                ignoreFollow.add(nonTerminal)

                if (!this.nonTerminals.has(nonTerminal)) throw new Error(`Unknown symbole: ${nonTerminal}`)

                if (nonTerminal == 'S') terminal.add('EOF') // If nonterminal is tree root, next is EOF
                else {
                    for (let [_, rules] of this.rules) for (let rule of rules) { // For every rule of every nonterminal
                        if (rule.symboles.length == 0) { // If epsilon, ignore rule
                            // if (!ignoreFollow.has(rule.nonTerminal)) // if not handled, need to find follow
                            // follow.add(rule.nonTerminal)
                        } else {
                            let index = rule.symboles.indexOf(nonTerminal)
                            if (index == -1) continue; // If rule rontaine nonterminal 
                            index++
                            if (index >= rule.symboles.length) { // If nonterminal is last symbole
                                if (!ignoreFollow.has(rule.nonTerminal)) // if not handled, need to find follow
                                    follow.add(rule.nonTerminal)
                            } else { // If not last symbole
                                let symbole = rule.symboles[index] // Get next symbole
                                if (this.terminals.has(symbole)) // If such symbole is a terminal, take note
                                    terminal.add(symbole)
                                else if (!ignoreFirst.has(symbole)) // If sych symbole is a nonterminal and not already handled, need to first its firsts 
                                    firsts.add(symbole)
                            }
                        }
                    }
                }
            }
        }

        return terminal
    }


    parse(input: string) {
        let symboleTokens: SymboleToken[] = this.getSymboleTokens(input)
        let analysisTable: Map<string, Map<string, Rule>> = this.getAnalysisTable()

        let EOF = new ASTStep('EOF')
        let S = new ASTStep('S')
        EOF.children.push(S)
        let stack = [S, EOF]
        while (stack.length != 0) { // Until stack is empty
            let headSymbole: SymboleToken = symboleTokens.shift()
            let headStack: ASTStep = stack.shift()

            if (this.nonTerminals.has(headStack.type)) {
                if (!analysisTable.get(headStack.type).get(headSymbole.type)) // if rules does not lead to head symbole
                    throw `Unexpected symbole at line ${headSymbole.line} column ${headSymbole.column}: "${headSymbole.value}" while parsing rule for ${headStack.type}`

                // Replace stack head by rule symboles
                for (let symbole of [...analysisTable.get(headStack.type).get(headSymbole.type).symboles].reverse()) {
                    let asas = new ASTStep(symbole)
                    headStack.rule = analysisTable.get(headStack.type).get(headSymbole.type)
                    headStack.children.unshift(asas)
                    stack.unshift(asas) // Pushback new step into stack
                }

                // Pushback symbole as it is not used
                symboleTokens.unshift(headSymbole)
                continue;
            }

            if (this.terminals.has(headStack.type)) {
                if (headStack.type != headSymbole.type)
                    throw `Unexpected symbole at line ${headSymbole.line} column ${headSymbole.column}: "${headSymbole.value}" while parsing rule ${headStack.type}`

                headStack.value = headSymbole.value
            }
        }
        return S
    }


}

/**
 * FUNCTIONS
 */

/**
 * MAIN
 */

export { SymboleReader, SymboleToken, Rule, ASTStep, LLAnalyser }