const { mathexpr_lla, calculate } = require('./mathexpr')

console.log(mathexpr_lla.follow('Ep'))

let ast = mathexpr_lla.parse('( 1+-2 * (1/2) --1) * 1e2')

console.log(ast)


console.log(calculate(ast.flatten()))

