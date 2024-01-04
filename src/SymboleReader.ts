import { SymboleToken } from "./SymboleToken.js"

type TokenGenerator = (string) => (SymboleToken | null)

/**
 * SymboleReader
 * 
 * An object containing the regex used to readd a given symbole and the function used to generate a token
 */
export class SymboleReader {

    regex: RegExp
    token_generator: TokenGenerator

    constructor(
        regex: RegExp,
        token_generator: TokenGenerator = str => new SymboleToken(str)) {

        this.regex = new RegExp('^' + regex.source)
        this.token_generator = token_generator

    }

    // PREFAB

    static skip_carriage_return(): SymboleReader {

        return new SymboleReader(/\n/, _ => null)

    }

    static skip_spacing(): SymboleReader {

        return new SymboleReader(/\s/, _ => null)

    }

    static float_with_exponent(token_type: string): SymboleReader {

        return new SymboleReader(
            /([-+]?\d*\.?\d+)(?:[eE]([-+]?\d+))?/,
            str => new SymboleToken(token_type, Number(str))
        )

    }

    static id_string(token_type: string): SymboleReader {

        return new SymboleReader(
            /[a-zA-Z0-9][_a-zA-Z0-9]*/,
            str => new SymboleToken(token_type, str)
        )

    }

}