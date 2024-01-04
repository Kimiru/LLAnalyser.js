/**
 * Rule
 *
 * An object that represent a grammar rule to apply and the action to perform after AST has been calculated
 */
export class Rule {
    static default_action = Rule.return_arguments_as_array;
    non_terminal;
    symboles;
    action;
    constructor(non_terminal, symboles, action = Rule.default_action) {
        this.non_terminal = non_terminal;
        this.symboles = symboles;
        this.action = action;
    }
    static return_arguments_as_array(...args) {
        return args;
    }
    static return_arguments_as_flat_array(...args) {
        let result = [];
        for (let arg of args) {
            if (arg === null)
                continue;
            if (Array.isArray(arg))
                result = [...result, ...arg];
            else
                result.push(arg);
        }
        return result;
    }
    toString() {
        return `${this.non_terminal} ' -> ' ${(this.symboles.length ? this.symboles.join(' ') : 'epsilon')}`;
    }
}
