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

    /**
     * Build a new rule
     * if symboles list is empty, it will be considered as epsilon
     * 
     * @param nonTerminal 
     * @param symboles 
     * @param action 
     */
    constructor(nonTerminal: string, symboles: string[], action: Function = (...args) => args) {
        this.nonTerminal = nonTerminal
        this.symboles = symboles
        this.action = action
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
    rule: any

    constructor(type = '') {

        this.type = type
        this.value = null
        this.token = null
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
                let unknownPart = input.substring(lastIndex, currentIndex - lastIndex)

                throw new Error(`Cannot progress during tokens splicing, unkown character${unknownPart.length > 1 ? 's' : ''}: "${unknownPart}"`)


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

}

/**
 * FUNCTIONS
 */

/**
 * MAIN
 */

export { SymboleReader, SymboleToken, Rule, ASTStep, LLAnalyser }