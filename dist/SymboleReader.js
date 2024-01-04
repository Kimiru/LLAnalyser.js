import { SymboleToken } from "./SymboleToken.js";
/**
 * SymboleReader
 *
 * An object containing the regex used to readd a given symbole and the function used to generate a token
 */
export class SymboleReader {
    regex;
    token_generator;
    constructor(regex, token_generator = str => new SymboleToken(str)) {
        this.regex = new RegExp('^' + regex.source);
        this.token_generator = token_generator;
    }
    // PREFAB
    static skip_carriage_return() {
        return new SymboleReader(/\n/, _ => null);
    }
    static skip_spacing() {
        return new SymboleReader(/\s/, _ => null);
    }
    static float_with_exponent(token_type) {
        return new SymboleReader(/([-+]?\d*\.?\d+)(?:[eE]([-+]?\d+))?/, str => new SymboleToken(token_type, Number(str)));
    }
    static id_string(token_type) {
        return new SymboleReader(/[a-zA-Z0-9][_a-zA-Z0-9]*/, str => new SymboleToken(token_type, str));
    }
}
