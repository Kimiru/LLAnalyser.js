const { mathexpr_lla, calculate } = require('./mathexpr')

let ast = mathexpr_lla.parse('( 1+-2 * (1/2) --1) * 1e2')


console.log(calculate(ast.flatten()))

