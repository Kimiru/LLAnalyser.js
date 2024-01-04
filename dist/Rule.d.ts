/**
 * Rule
 *
 * An object that represent a grammar rule to apply and the action to perform after AST has been calculated
 */
export declare class Rule {
    static default_action: typeof Rule.return_arguments_as_array;
    non_terminal: string;
    symboles: string[];
    action: Function;
    constructor(non_terminal: string, symboles: string[], action?: Function);
    static return_arguments_as_array<T>(...args: T[]): T[];
    static return_arguments_as_flat_array(...args: any[]): any[];
    toString(): string;
}
