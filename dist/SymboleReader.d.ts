import { SymboleToken } from "./SymboleToken.js";
type TokenGenerator = (string: any) => (SymboleToken | null);
/**
 * SymboleReader
 *
 * An object containing the regex used to readd a given symbole and the function used to generate a token
 */
export declare class SymboleReader {
    regex: RegExp;
    token_generator: TokenGenerator;
    constructor(regex: RegExp, token_generator?: TokenGenerator);
    static skip_carriage_return(): SymboleReader;
    static skip_spacing(): SymboleReader;
    static float_with_exponent(token_type: string): SymboleReader;
    static id_string(token_type: string): SymboleReader;
}
export {};
