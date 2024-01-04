import { Rule } from "./Rule.js";
/**
 * Abstract Syntax Tree Step
 *
 * Contains all the information parse by the grammar interpreter, ready to be flattened by the user instructions.
 */
export declare class ASTStep {
    type: string;
    value: any;
    token: any;
    children: ASTStep[];
    rule: Rule | null;
    constructor(type: string);
    flatten<T = any>(): T;
}
