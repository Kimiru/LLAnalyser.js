/**
 * SymboleToken
 *
 * an object containing the type of the symbole read, its associated value and it's location.
 * ex:
 *      type: 'if'  value: 'if'
 *      type: 'nbr' value: 5
 *      type: 'id'  value: 'index'
 */
export class SymboleToken {
    type;
    value;
    line = 0;
    column = 0;
    constructor(type, value = undefined) {
        this.type = type;
        if (value === undefined)
            this.value = type;
        else
            this.value = value;
    }
}
