/**
 * SymboleToken
 *
 * an object containing the type of the symbole read, its associated value and it's location.
 * ex:
 *      type: 'if'  value: 'if'
 *      type: 'nbr' value: 5
 *      type: 'id'  value: 'index'
 */
export declare class SymboleToken {
    type: string;
    value: any;
    line: number;
    column: number;
    constructor(type: string, value?: any);
}
