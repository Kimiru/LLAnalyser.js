/**
 * Abstract Syntax Tree Step
 *
 * Contains all the information parse by the grammar interpreter, ready to be flattened by the user instructions.
 */
export class ASTStep {
    type;
    value = null;
    token = null;
    children = [];
    rule = null;
    constructor(type) {
        this.type = type;
    }
    flatten() {
        let args = [];
        for (let child of this.children) {
            let flattened_child = child.flatten();
            args.push(flattened_child);
        }
        if (this.rule === null)
            return this.value;
        else
            return this.rule.action(...args);
    }
}
