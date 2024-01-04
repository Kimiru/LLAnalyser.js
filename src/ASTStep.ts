import { Rule } from "./Rule.js"

/**
 * Abstract Syntax Tree Step
 * 
 * Contains all the information parse by the grammar interpreter, ready to be flattened by the user instructions. 
 */
export class ASTStep {

    type: string
    value: any = null
    token: any = null
    children: ASTStep[] = []
    rule: Rule | null = null

    constructor(type: string) {

        this.type = type

    }

    flatten<T = any>(): T {

        let args: any[] = []

        for (let child of this.children) {

            let flattened_child = child.flatten()

            args.push(flattened_child)

        }

        if (this.rule === null)
            return this.value
        else
            return this.rule.action(...args)

    }

}