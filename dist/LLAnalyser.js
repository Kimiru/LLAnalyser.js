import { ASTStep } from "./ASTStep.js";
import { SymboleToken } from "./SymboleToken.js";
/**
 * LL(1) Grammar Parser/Analyser
 *
 * Used to simply create a parser able to read an input with a given grammar and return a custom Abtract syntaxe tree
 */
export class LLAnalyser {
    symbole_readers;
    terminals;
    non_terminals;
    rules = { 'S': [] };
    constructor() {
        this.symbole_readers = [];
        this.terminals = new Set();
        this.terminals.add('EOF');
        this.non_terminals = new Set();
        this.non_terminals.add('S');
    }
    add_symbole_reader(...symbole_readers) {
        for (let symbole_reader of symbole_readers)
            this.symbole_readers.push(symbole_reader);
    }
    /**
     * Add a given terminal to the anlyser
     * if the terminal was already defined, nothing will happen
     * if the terminal was already defined as a non terminal, it will throw an error.
     */
    add_terminal(...terminals) {
        for (let terminal of terminals) {
            if (this.non_terminals.has(terminal))
                throw new Error(`Conflict: ${terminal} is already a non-terminal`);
            this.terminals.add(terminal);
        }
    }
    /**
     * Add a given rule to the analyser
     *
     * @param {...Rule} rules
     */
    add_rule(...rules) {
        for (const rule of rules) {
            if (this.terminals.has(rule.non_terminal))
                throw new Error(`Conflict: ${rule.non_terminal} is already a terminal`);
            if (!this.non_terminals.has(rule.non_terminal)) {
                this.non_terminals.add(rule.non_terminal);
                this.rules[rule.non_terminal] = [];
            }
            this.rules[rule.non_terminal].push(rule);
        }
    }
    get_symbole_tokens(input) {
        let token_list = [];
        let last_index = -1;
        let current_index = 0;
        let line = 1;
        let column = 1;
        while (input && current_index < input.length) {
            if (current_index === last_index) {
                last_index = current_index;
                current_index++;
                while (current_index < input.length) {
                    let result = this.find_token(input, current_index);
                    if (!result) {
                        current_index++;
                        continue;
                    }
                    break;
                }
                let unknownPart = input.substring(last_index, current_index);
                throw new Error(`Cannot progress during tokens splicing, line ${line} column ${column}, unkown character${unknownPart.length > 1 ? 's' : ''}: "${unknownPart}"`);
            }
            last_index = current_index;
            let result = this.find_token(input, current_index);
            if (!result)
                continue;
            line += result.line_break;
            if (result.line_break)
                column = 1;
            column += result.column;
            current_index += result.length;
            if (result.symbole_token) {
                result.symbole_token.line = line;
                result.symbole_token.column = column;
                token_list.push(result.symbole_token);
            }
        }
        let eof = new SymboleToken('EOF');
        eof.line = line;
        eof.column = column;
        token_list.push(eof);
        return token_list;
    }
    find_token(in_input, at_index) {
        for (let symboleReader of this.symbole_readers) {
            let str = in_input.substring(at_index);
            let regexExecutionResult = symboleReader.regex.exec(str);
            if (regexExecutionResult) {
                let symbole_token = symboleReader.token_generator(regexExecutionResult[0]);
                let line_break = 0, column = 0;
                for (let char of regexExecutionResult[0]) {
                    if (char == '\n') {
                        line_break++;
                        column = 0;
                    }
                    else
                        column++;
                }
                return {
                    symbole_token,
                    line_break,
                    column,
                    length: regexExecutionResult[0].length
                };
            }
        }
        return null;
    }
    /**
     * Calculate and return the analysis table of the stored gammar
     */
    get_analysis_table() {
        let analysis_table = {};
        for (let nonTerminal of this.non_terminals) {
            analysis_table[nonTerminal] = {};
            for (let terminal of this.terminals)
                analysis_table[nonTerminal][terminal] = null;
        }
        for (let key in this.rules) {
            let rules = this.rules[key];
            for (let rule of rules) {
                let firsts = this.first(rule.symboles[0] ?? null);
                for (let terminal of firsts) {
                    if (terminal !== null) {
                        if (analysis_table[rule.non_terminal][terminal] === null)
                            analysis_table[rule.non_terminal][terminal] = rule;
                        else
                            throw new Error(`AnalysisTable Conflict: Incompatible rules\n${analysis_table[rule.non_terminal][terminal].toString()} firsts: Set { ${[...this.first(analysis_table[rule.non_terminal][terminal].symboles[0])].join(', ')} }\n${rule.toString()} firsts: Set { ${[...firsts].join(', ')} }\nPlease, check for firsts and follow`);
                    }
                    else {
                        let follows = this.follow(rule.non_terminal);
                        for (let terminal of follows) {
                            if (analysis_table[rule.non_terminal][terminal] === null)
                                analysis_table[rule.non_terminal][terminal] = rule;
                            else
                                throw new Error(`AnalysisTable Conflict: Incompatible rules\n${analysis_table[rule.non_terminal][terminal].toString()} firsts: Set { ${[...this.first(analysis_table[rule.non_terminal][terminal].symboles[0])].join(', ')} }\n${rule.toString()} firsts: Set { ${[...firsts].join(', ')} }\nPlease, check for firsts and follow`);
                        }
                    }
                }
            }
        }
        return analysis_table;
    }
    first(s, ignore = new Set()) {
        if (ignore.has(s))
            return new Set();
        if (s === null)
            return new Set([null]);
        if (this.terminals.has(s))
            return new Set([s]);
        if (this.non_terminals.has(s)) {
            ignore.add(s);
            let set = new Set();
            this.rules[s]?.forEach(rule => {
                if (rule.symboles.length) {
                    let firsts = this.first(rule.symboles[0], ignore);
                    firsts.forEach(e => set.add(e));
                }
                else
                    set.add(null);
            });
            if (!set.size)
                set.add(null);
            return set;
        }
        throw new Error(`Unknown symbole: "${s}" it is neither a terminal nor a non-terminal`);
    }
    follow(s, ignore = new Set()) {
        if (ignore.has(s))
            return new Set();
        if (this.non_terminals.has(s)) {
            ignore.add(s);
            let set = new Set();
            if (s == 'S')
                set.add('EOF');
            for (let key in this.rules) {
                let rules = this.rules[key];
                for (let rule of rules) {
                    if (rule.symboles.includes(s)) {
                        let index = rule.symboles.indexOf(s);
                        while (index < rule.symboles.length - 1) {
                            let firsts = this.first(rule.symboles[index + 1]);
                            for (let element of firsts)
                                if (element !== null)
                                    set.add(element);
                            if (firsts.has(null))
                                index++;
                            else
                                break;
                        }
                        if (index == rule.symboles.length - 1) {
                            let follows = this.follow(rule.non_terminal, new Set([...ignore]));
                            follows.forEach(e => set.add(e));
                        }
                    }
                }
            }
            return set;
        }
        throw new Error(`Unknown symbole: "${s}" it is neither a terminal nor a non-terminal`);
    }
    /**
     *
     * @param {Rule} rule
     * @returns {Set<string>}
     */
    firstsOfRule(rule) {
        let terminal = new Set(); // Result
        let firsts = new Set(); // Nonterminals for which we need to find firsts
        let follow = new Set(); // Nonterminals for which we need to find follows
        let ignoreFirst = new Set(); // Nonterminals for which we already found firsts
        let ignoreFollow = new Set(); // Nonterminals for which we already found follows
        if (rule.symboles.length) // If not epsilon
            if (this.terminals.has(rule.symboles[0])) // If first symbole is a terminal
                terminal.add(rule.symboles[0]);
            else // If first symbole is a nonterminal, need to check for its first
                firsts.add(rule.symboles[0]);
        else // If epsilon, need to check for follow
            follow.add(rule.non_terminal);
        while (firsts.size || follow.size) { // If firsts nonterminal or follow of nonterminal need to be treated
            for (let non_terminal of [...firsts]) {
                firsts.delete(non_terminal);
                ignoreFirst.add(non_terminal);
                if (!this.non_terminals.has(non_terminal))
                    throw new Error(`Unknown symbole: "${non_terminal}" it is neither a terminal nor a non-terminal`);
                for (let rule of this.rules[non_terminal] ?? []) { // For each rules of the nonterminal
                    if (rule.symboles.length) { // If not epsilon
                        if (this.terminals.has(rule.symboles[0])) // If first symbole is a terminal
                            terminal.add(rule.symboles[0]);
                        else if (!ignoreFirst.has(rule.symboles[0])) // If first symbole is a nonterminal and has not already been handled, need to check for its first
                            firsts.add(rule.symboles[0]);
                    }
                    else if (!ignoreFollow.has(non_terminal)) // If epsilon, need to check for follow and has not already been handled
                        follow.add(non_terminal);
                }
            }
            for (let nonTerminal of [...follow]) {
                follow.delete(nonTerminal);
                ignoreFollow.add(nonTerminal);
                if (!this.non_terminals.has(nonTerminal))
                    throw new Error(`Unknown symbole: ${nonTerminal}`);
                if (nonTerminal == 'S')
                    terminal.add('EOF'); // If nonterminal is tree root, next is EOF
                else {
                    for (let key in this.rules) {
                        let rules = this.rules[key];
                        for (let rule of rules) { // For every rule of every nonterminal
                            if (rule.symboles.length !== 0) { // If epsilon, ignore rule
                                let index = rule.symboles.indexOf(nonTerminal);
                                if (index == -1)
                                    continue; // If rule contains nonterminal 
                                index++;
                                if (index >= rule.symboles.length) { // If nonterminal is last symbole
                                    if (!ignoreFollow.has(rule.non_terminal)) // if not handled, need to find follow
                                        follow.add(rule.non_terminal);
                                }
                                else { // If not last symbole
                                    let symbole = rule.symboles[index]; // Get next symbole
                                    if (this.terminals.has(symbole)) // If such symbole is a terminal, take note
                                        terminal.add(symbole);
                                    else if (!ignoreFirst.has(symbole)) // If such symbole is a nonterminal and not already handled, need to first its firsts 
                                        firsts.add(symbole);
                                }
                            }
                        }
                    }
                }
            }
        }
        return terminal;
    }
    parse(input) {
        let symboleTokens = this.get_symbole_tokens(input);
        let analysis_table = this.get_analysis_table();
        let EOF = new ASTStep('EOF');
        let S = new ASTStep('S');
        EOF.children.push(S);
        let stack = [S, EOF];
        while (stack.length != 0) { // Until stack is empty
            let head_symbole = symboleTokens.shift();
            let head_stack = stack.shift();
            if (this.non_terminals.has(head_stack.type)) {
                if (!analysis_table[head_stack.type][head_symbole.type]) // if rules does not lead to head symbole
                    throw `Unexpected symbole at line ${head_symbole.line} column ${head_symbole.column}: "${head_symbole.value}" while parsing rule for ${head_stack.type}`;
                // Replace stack head by rule symboles
                for (let symbole of [...analysis_table[head_stack.type][head_symbole.type].symboles].reverse()) {
                    let asas = new ASTStep(symbole);
                    head_stack.rule = analysis_table[head_stack.type][head_symbole.type];
                    head_stack.children.unshift(asas);
                    stack.unshift(asas); // Pushback new step into stack
                }
                // Pushback symbole as it is not used
                symboleTokens.unshift(head_symbole);
                continue;
            }
            if (this.terminals.has(head_stack.type)) {
                if (head_stack.type != head_symbole.type)
                    throw `Unexpected symbole at line ${head_symbole.line} column ${head_symbole.column}: "${head_symbole.value}" while parsing rule ${head_stack.type}`;
                head_stack.value = head_symbole.value;
            }
        }
        return S;
    }
}
