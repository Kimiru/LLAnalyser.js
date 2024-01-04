import { ASTStep } from "./ASTStep.js";
import { Rule } from "./Rule.js";
import { SymboleReader } from "./SymboleReader.js";
import { SymboleToken } from "./SymboleToken.js";
/**
 * LL(1) Grammar Parser/Analyser
 *
 * Used to simply create a parser able to read an input with a given grammar and return a custom Abtract syntaxe tree
 */
export declare class LLAnalyser {
    symbole_readers: SymboleReader[];
    terminals: Set<string>;
    non_terminals: Set<string>;
    rules: {
        [str: string]: Rule[];
    };
    constructor();
    add_symbole_reader(...symbole_readers: SymboleReader[]): void;
    /**
     * Add a given terminal to the anlyser
     * if the terminal was already defined, nothing will happen
     * if the terminal was already defined as a non terminal, it will throw an error.
     */
    add_terminal(...terminals: string[]): void;
    /**
     * Add a given rule to the analyser
     *
     * @param {...Rule} rules
     */
    add_rule(...rules: Rule[]): void;
    get_symbole_tokens(input: string): SymboleToken[];
    private find_token;
    /**
     * Calculate and return the analysis table of the stored gammar
     */
    get_analysis_table(): {
        [str: string]: {
            [str: string]: Rule | null;
        };
    };
    first(s: any, ignore?: Set<string | null>): Set<string | null>;
    follow(s: any, ignore?: Set<string>): Set<string>;
    /**
     *
     * @param {Rule} rule
     * @returns {Set<string>}
     */
    firstsOfRule(rule: Rule): Set<string>;
    parse(input: string): ASTStep;
}
