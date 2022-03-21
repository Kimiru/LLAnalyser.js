class LLAnalyser {
    tokens: any[]
    terminals: string[]
    nonTerminals: string[]
    rules: Map<string, { symboles: string[], action: Function }[]>

    /**
     * 
     * @param {String} input 
     */
    constructor() {
        this.tokens = []
        this.terminals = ['EOF']
        this.nonTerminals = []
        this.rules = new Map();
        this.addNonTerminal('S')
    }

    /**
     * 
     * @param {RegExp} regex 
     * @param {Function} action 
     */
    addToken(regex: RegExp, action = token => new Token(token)) {
        let sauce = regex.source
        let tuple = { regex: new RegExp('^' + sauce), action }
        this.tokens.push(tuple)
    }

    addTerminal(...terminals: string[]) {
        for (let terminal of terminals) {
            if (this.terminals.includes(terminal)) throw new Error('Conflict: "' + terminal + '" is already a terminal')
            if (this.nonTerminals.includes(terminal)) throw new Error('Conflict: "' + terminal + '" is already a non terminal')

            this.terminals.push(terminal)
        }
    }

    addNonTerminal(...nonTerminals: string[]) {
        for (let nonTerminal of nonTerminals) {
            if (this.terminals.includes(nonTerminal)) throw new Error('Conflict: "' + nonTerminal + '" is already a terminal')
            if (this.nonTerminals.includes(nonTerminal)) throw new Error('Conflict: "' + nonTerminal + '" is already a non terminal')

            this.nonTerminals.push(nonTerminal)
            this.rules.set(nonTerminal, [])
        }
    }

    addRule(nonTerminal: string, symboles: string[], action: Function) {
        if (!this.nonTerminals.includes(nonTerminal))
            throw new Error('Undefined nonTerminal "' + nonTerminal + '"')
        for (let symbole of symboles) {
            if (this.nonTerminals.includes(symbole)) continue
            if (this.terminals.includes(symbole)) continue

            throw new Error('Undefined symbole "' + symbole + '"')
        }
        // for (let rule of this.rules[nonTerminal]) {
        //     if (rule.symboles[0] == symboles[0])
        //         throw new Error('Conflict: non deterministic ruleset for nonTerminal "' + nonTerminal + '"')
        // }
        this.rules.get(nonTerminal).push({ symboles, action })
    }

    /**
     * 
     * @param {String} input 
     */
    getTokens(input) {
        // console.log('"' + input + '"')
        let tokenList = []
        let lastIndex = -1
        let tokenIndex = 0

        let line = 1
        let column = 1

        tokenloop:
        while (tokenIndex < input.length) {
            if (lastIndex == tokenIndex) throw new Error('Cannot progress during tokens splicing')
            lastIndex = tokenIndex
            for (let tuple of this.tokens) {
                let exec = tuple.regex.exec(input.substring(tokenIndex))
                if (exec) {
                    try {
                        let token = tuple.action(exec[0], line, column)

                        if (token) {
                            token.line = line
                            token.column = column
                            tokenList.push(token)
                        }
                        tokenIndex += exec[0].length
                        for (let char of exec[0]) {
                            if (char == '\n') {
                                line++
                                column = 1
                            } else
                                column++
                        }
                        continue tokenloop
                    } catch (err) {
                        return { success: false, error: err }
                    }

                }
            }
        }
        let eofToken = new Token('EOF')
        eofToken.line = line
        eofToken.column = column
        tokenList.push(eofToken)
        return { success: true, value: tokenList }
    }

    firstOfRule(nt, rule) {

        let terminal: Set<string> = new Set()
        let firsts: Set<string> = new Set()
        let follow: Set<string> = new Set()
        let ignoreFirst: Set<string> = new Set()
        let ignoreFollow: Set<string> = new Set()

        if (rule.symboles.length)
            if (this.terminals.includes(rule.symboles[0]))
                terminal.add(rule.symboles[0])
            else
                firsts.add(rule.symboles[0])
        else
            follow.add(nt)

        while (firsts.size || follow.size) {
            for (let nonTerminal of [...firsts]) {
                firsts.delete(nonTerminal)
                ignoreFirst.add(nonTerminal)

                for (let rule of this.rules.get(nonTerminal)) {
                    if (rule.symboles.length) {
                        if (this.terminals.includes(rule.symboles[0]))
                            terminal.add(rule.symboles[0])
                        else if (!ignoreFirst.has(rule.symboles[0]))
                            firsts.add(rule.symboles[0])
                    } else if (!ignoreFollow.has(nonTerminal))
                        follow.add(nonTerminal)
                }
            }

            for (let nonTerminal of [...follow]) {


                follow.delete(nonTerminal)
                ignoreFollow.add(nonTerminal)

                if (nonTerminal == 'S') terminal.add('EOF')
                else {
                    for (let ruleNonTerminal of this.rules.keys())
                        for (let rule of this.rules.get(ruleNonTerminal)) {
                            if (rule.symboles.length == 0) {
                                continue
                            } else {
                                let index = rule.symboles.indexOf(nonTerminal)
                                if (index == -1) continue;
                                index++
                                if (index >= rule.symboles.length) {
                                    if (!ignoreFollow.has(ruleNonTerminal))
                                        follow.add(ruleNonTerminal)
                                } else {
                                    let symbole = rule.symboles[index]
                                    if (this.terminals.includes(symbole))
                                        terminal.add(symbole)
                                    else if (!ignoreFirst.has(symbole))
                                        firsts.add(symbole)
                                }
                            }
                        }
                }
            }
        }

        return [...terminal]
    }

    firstOfNonTerminal(nonTerminal, ignore = []) {

        ignore.push(nonTerminal)

        let res = []

        for (let rule of this.rules.get(nonTerminal)) {
            if (rule.symboles.length == 0)
                if (!ignore.includes(nonTerminal)) {
                    let tmp = this.followOfNonTerminal(nonTerminal, ignore)
                    for (let symbole of tmp) if (!res.includes(symbole))
                        res.push(symbole)
                } else
                    continue



            let firstSymbole = rule.symboles[0]
            if (this.terminals.includes(firstSymbole)) if (!res.includes(firstSymbole))
                res.push(firstSymbole)

            if (this.nonTerminals.includes(firstSymbole)) {
                if (!ignore.includes(firstSymbole)) {
                    let tmp = this.firstOfNonTerminal(firstSymbole, ignore)
                    for (let symbole of tmp) if (!res.includes(symbole))
                        res.push(symbole)
                }
            }
        }

        return res
    }

    followOfNonTerminal(nonTerminal, ignore = []) {
        let followTerminal = []
        let followNonTerminal = []
        // console.log(nonTerminal)

        if (nonTerminal == 'S') followTerminal.push('EOF')

        for (let nt of this.rules.keys())
            for (let rule of this.rules.get(nt)) {
                if (rule.symboles.length == 0) continue

                let index = rule.symboles.indexOf(nonTerminal)
                if (index == -1) continue

                if (index + 1 == rule.symboles.length) {
                    if (ignore.includes(nt)) continue
                    ignore.push(nt)
                    let tmp = this.followOfNonTerminal(nt, ignore)
                    for (let t of tmp) {
                        if (!followTerminal.includes(t))
                            followTerminal.push(t)
                    }
                } else {
                    let symbole = rule.symboles[index + 1]

                    if (this.terminals.includes(symbole))
                        if (!followTerminal.includes(symbole))
                            followTerminal.push(symbole)
                    if (this.nonTerminals.includes(symbole))
                        if (!followNonTerminal.includes(symbole))
                            followNonTerminal.push(symbole)
                }
            }

        for (let nt of followNonTerminal) {
            if (ignore.includes(nt)) continue
            let res = this.firstOfNonTerminal(nt, ignore)
            for (let t of res) {
                if (!followTerminal.includes(t))
                    followTerminal.push(t)
            }
        }

        return followTerminal
    }

    getAnalysisTable() {
        let analysisTable = {}
        for (let nt of this.nonTerminals) {
            analysisTable[nt] = {}
            for (let t of this.terminals)
                analysisTable[nt][t] = null
        }

        for (let [key, value] of this.rules.entries())
            for (let rule of value) {
                let firsts = this.firstOfRule(key, rule)
                // console.log(key, firsts)
                for (let first of firsts)
                    if (!analysisTable[key][first])
                        analysisTable[key][first] = rule
                    else throw 'AnalysisTable Conflict: there is some... issues in your language ' + `${key}->${analysisTable[key][first].symboles.join('')} ${key}->${rule.symboles.join('')}`
            }

        return analysisTable
    }

    parse(input) {
        let res = this.getTokens(input)
        if (!res.success) throw (res.error)
        let tokens = res.value

        // console.log(tokens)

        let analysisTable = this.getAnalysisTable()

        // console.log(analysisTable)

        let eof = new ASAStep('EOF')
        let S = new ASAStep('S')
        eof.children.push('S')
        let stack = [S, eof]

        while (stack.length != 0) {
            let token = tokens.shift()
            let top = stack.shift()


            if (this.nonTerminals.includes(top.type)) {
                if (!analysisTable[top.type][token.token]) throw `Unexpected symbole at line ${token.line} column ${token.column}: "${token.value}" while parsing rule ${top.type}`

                // console.log(token.token + ':' + top.type + '->' + analysisTable[top.type][token.token].symboles.join(' '))

                for (let symbole of [...analysisTable[top.type][token.token].symboles].reverse()) {
                    let asas = new ASAStep(symbole)
                    top.rule = analysisTable[top.type][token.token]
                    top.children.unshift(asas)
                    stack.unshift(asas)
                }

                tokens.unshift(token)
                continue;
            }

            if (this.terminals.includes(top.type)) {
                //console.log(top.type, token.token)
                if (top.type != token.token) throw `Unexpected symbole at line ${token.line} column ${token.column}: "${token.value}" expected "${top.type}"\n`

                // console.log('eat:' + top.type)
                top.value = token.value
                top.token = token
            }

        }

        return S.flatten()
    }

    toString() {
        let str = ''
    }

}

class Token {
    token: any
    value: any
    line: number
    column: number
    constructor(token, value = undefined) {
        this.token = token
        this.value = value
        if (!this.value)
            this.value = this.token
        this.line = this.column = 0
    }
}

class ASAStep {
    type: string
    value: any
    token: any
    children: any[]
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

export { LLAnalyser, Token, ASAStep }