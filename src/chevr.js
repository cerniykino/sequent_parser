import { createToken, Lexer, CstParser } from 'chevrotain';
//import fs from 'fs/promises'

// Create a Chevrotain lexer token for each element


const Implication = createToken({ name: "Implication", pattern: /->|=>/ });
const Conjunction = createToken({ name: "Conjunction", pattern: /∧|\/\\/});
const Disjunction = createToken({ name: "Disjunction", pattern: /∨|\\\// });
const Negation = createToken({ name: "Negation", pattern: /¬|!/ });
const Turnstile = createToken({ name: "Turnstile", pattern: /⊢/ });
const Letter = createToken({ name: "Letter", pattern: /[A-Za-z]/ });
const Comma = createToken({ name: 'Comma', pattern: /,/ });

const WhiteSpace = createToken({
    name:"Whitespace",
    pattern: /\s+/,
    group: Lexer.SKIPPED
})

const LineBreak = createToken({
    name: "LineBreak",
    pattern: /\r\n?|\n/,
    // This token will be ignored in the final token output
    group: Lexer.SKIPPED
});

const OpenBrace = createToken({
    name: "OpenBrace",
    pattern: /\{|\(/
});

const CloseBrace = createToken({
    name: "CloseBrace",
    pattern: /\}|\)/
});

// Define the order of tokens is important
let allTokens = [
    Turnstile,    // "⊢"
    Implication,  // "->" or "=>"
    Conjunction,  // "∧"
    Disjunction,  // "∨"
    Negation,     // "¬" or "!"
    OpenBrace,    // "(" or "{"
    CloseBrace,   // ")" or "}"
    Comma,        // ","
    Letter,       // General letters
    WhiteSpace,   // Spaces, tabs, newlines (if skipped)
    LineBreak     // Line breaks (if skipped)
];
let SequentsLexer = new Lexer(allTokens);

class SequentParser extends CstParser {
    constructor() {
        super(allTokens);

        const $ = this;

        $.RULE('sequent', () => {
            $.SUBRULE($.antecedent);
            $.CONSUME(Turnstile);
            $.SUBRULE($.consequent);
        });

        $.RULE('antecedent', () => {
            $.SUBRULE($.formulaList);
        });

        $.RULE('consequent', () => {
            $.SUBRULE($.formulaList);
        });

        $.RULE('formulaList', () => {
            $.SUBRULE($.formula);
            $.MANY(() => {
                $.CONSUME(Comma);
                $.SUBRULE2($.formula);
            });
        });

        $.RULE('formula', () => {
            $.SUBRULE($.atomicFormula);
            $.MANY(() => {
                $.OR([
                    { ALT: () => $.CONSUME(Conjunction) },
                    { ALT: () => $.CONSUME(Disjunction) },
                    { ALT: () => $.CONSUME(Implication) },
                    { ALT: () => $.CONSUME(Negation) }
                ]);
                $.SUBRULE2($.atomicFormula);
            });
        });

        $.RULE('atomicFormula', () => {
            $.OR([
                { ALT: () => $.CONSUME(Letter) },
                { ALT: () => {
                    $.CONSUME(OpenBrace);
                    $.SUBRULE($.formula);
                    $.CONSUME(CloseBrace);
                }}
            ]);
        });


        $.RULE('compoundFormula', () => {
            $.SUBRULE($.formula);
            $.OR([
                { ALT: () => $.CONSUME(Conjunction) },
                { ALT: () => $.CONSUME(Disjunction) },
                { ALT: () => $.CONSUME(Implication) },
                { ALT: () => $.CONSUME(Negation) }
            ]);
            $.SUBRULE2($.formula);
        });

        this.performSelfAnalysis();
    }
}
const parserInstance = new SequentParser();
class AstBuilder extends parserInstance.getBaseCstVisitorConstructor() {
    constructor() {
        super();
        this.validateVisitor();
    }

    sequent(ctx) {
        return {
            type: 'Sequent',
            antecedent: this.visit(ctx.antecedent),
            consequent: this.visit(ctx.consequent)
        };
    }

    antecedent(ctx) {
        return {
            type: 'Antecedent',
            formulas: this.visit(ctx.formulaList)
        };
    }

    consequent(ctx) {
        return {
            type: 'Consequent',
            formulas: this.visit(ctx.formulaList)
        };
    }

    formulaList(ctx) {
        return ctx.formula.map(formula => this.visit(formula));
    }

    formula(ctx) {
        const atomicFormulas = ctx.atomicFormula.map(atomicFormula => this.visit(atomicFormula));

        // Assuming operators are stored in ctx and captured as separate tokens
        // Adjust this part based on your actual CST structure
        const operators = [];
        if (ctx.Conjunction) {
            operators.push(...ctx.Conjunction.map(conj => '∧'));
        }
        if (ctx.Disjunction) {
            operators.push(...ctx.Disjunction.map(disj => '∨'));
        }
        if (ctx.Implication) {
            operators.push(...ctx.Implication.map(impl => '->'));
        }
        if (ctx.Negation) {
            operators.push(...ctx.Negation.map(neg => '¬'));
        }

        return {
            type: 'Formula',
            atomicFormulas: atomicFormulas,
            operators: operators
        };
    }

    atomicFormula(ctx) {
        if (ctx.Letter) {
            return {
                type: 'AtomicFormula',
                value: ctx.Letter[0].image
            };
        } else if (ctx.formula) {
            return this.visit(ctx.formula);
        }
    }

    compoundFormula(ctx) {
        // Process the 'compoundFormula' rule
        // Example implementation (adjust according to your needs):
        return {
            type: 'CompoundFormula',
            firstFormula: this.visit(ctx.formula[0]),
            operator: ctx.Conjunction ? 'Conjunction' :
                      ctx.Disjunction ? 'Disjunction' :
                      ctx.Implication ? 'Implication' :
                      ctx.Negation ? 'Negation' : null,
            secondFormula: this.visit(ctx.formula[1])
        };
    }

    // You might need to add more methods if you have other rules
}




function parseInput(inputText) {
    const lexingResult = SequentsLexer.tokenize(inputText);
    if (lexingResult.errors.length > 0) {
        throw new Error("Lexing errors detected");
    }

    parserInstance.input = lexingResult.tokens;
    const cst = parserInstance.sequent();

    if (parserInstance.errors.length > 0) {
        throw new Error("Parsing errors detected");
    }

    return cst;
}


function applyLeftConjunctionRule(sequent) {
    const newSequents = [];

    // Check each formula in the antecedent
    sequent.antecedent.formulas.forEach((formula, index) => {
        if (formula.operators.includes("∧")) {
            // Find the conjunction operator and split the formula
            const conjuncts = formula.atomicFormulas;

            // Create two new sequents for each part of the conjunction
            conjuncts.forEach(conjunct => {
                const newAntecedentFormulas = [...sequent.antecedent.formulas];
                newAntecedentFormulas[index] = { ...conjunct }; // Replace conjunction with one conjunct

                const newSequent = {
                    type: "Sequent",
                    antecedent: {
                        type: "Antecedent",
                        formulas: newAntecedentFormulas
                    },
                    consequent: sequent.consequent
                };

                newSequents.push(newSequent);
            });
        }
    });

    return newSequents;
}

function applyRightConjunctionRule(sequent) {
    const newSequents = [];

    // Check each formula in the consequent
    sequent.consequent.formulas.forEach((formula, index) => {
        if (formula.operators.includes("∧")) {
            // Find the conjunction operator and split the formula
            const conjuncts = formula.atomicFormulas;

            // Create two new sequents for each part of the conjunction
            conjuncts.forEach(conjunct => {
                const newConsequentFormulas = [...sequent.consequent.formulas];
                newConsequentFormulas[index] = { ...conjunct }; // Replace conjunction with one conjunct

                const newSequent = {
                    type: "Sequent",
                    antecedent: sequent.antecedent,
                    consequent: {
                        type: "Consequent",
                        formulas: newConsequentFormulas
                    }
                };

                newSequents.push(newSequent);
            });
        }
    });

    return newSequents;
}
function printSequentsFromArray(cstArray) {
    if (!Array.isArray(cstArray)) return printSequentFromCST(cstArray);

    return cstArray.map(node => printSequentFromCST(node)).join('\n');
}
function printSequentFromCST(node) {
    if (!node || !node.name) return '';

    switch (node.name) {
        case 'sequent':
            return printSequentFromCST(node.children.antecedent[0]) + ' ⊢ ' + printSequentFromCST(node.children.consequent[0]);
            case 'antecedent':

                return node.children.formulaList.map(printSequentFromCST).join(', ');
                case 'consequent':
                    console.log('fdsafdsa')
            return node.children.formulaList.map(printSequentFromCST).join(', ');
                    case 'formulaList':
                        return node.children.formula.map(printSequentFromCST).join(', ');

                        case 'formula':
                            // Note: Adjust the join string based on the actual structure of your CST
            let formulaComponents = node.children.atomicFormula.map(printSequentFromCST);
            if (node.children.Conjunction) {
                formulaComponents = formulaComponents.join(' ∧ ');
            } else if (node.children.Disjunction) {
                formulaComponents = formulaComponents.join(' ∨ ');
            } else if (node.children.Implication) {
                formulaComponents = formulaComponents.join(' → ');
            } else {
                formulaComponents = formulaComponents.join('');
            }
            return formulaComponents;
            case 'atomicFormula':
                if (node.children.Letter) {
                    return node.children.Letter[0].image;
                } else if (node.children.OpenBrace && node.children.CloseBrace && node.children.formula) {
                    // Handle nested formula inside braces
                    return '(' + printSequentFromCST(node.children.formula[0]) + ')';
                }
            return '';
                default:
                    return '';
    }
}

function applyLeftDisjunctionRule(sequent) {
    const newSequents = [];

    sequent.antecedent.formulas.forEach((formula, index) => {
        if (formula.operators.includes("∨")) {
            const disjuncts = formula.atomicFormulas;

            disjuncts.forEach(disjunct => {
                const newAntecedentFormulas = [...sequent.antecedent.formulas];
                newAntecedentFormulas[index] = { ...disjunct };

                const newSequent = {
                    type: "Sequent",
                    antecedent: {
                        type: "Antecedent",
                        formulas: newAntecedentFormulas
                    },
                    consequent: sequent.consequent
                };

                newSequents.push(newSequent);
            });
        }
    });

    return newSequents;
}


function applyRightDisjunctionRule(sequent) {
    const newSequents = [];

    sequent.consequent.formulas.forEach((formula, index) => {
        if (formula.operators.includes("∨")) {
            const disjuncts = formula.atomicFormulas;

            disjuncts.forEach(disjunct => {
                const newConsequentFormulas = [...sequent.consequent.formulas];
                newConsequentFormulas[index] = { ...disjunct };

                const newSequent = {
                    type: "Sequent",
                    antecedent: sequent.antecedent,
                    consequent: {
                        type: "Consequent",
                        formulas: newConsequentFormulas
                    }
                };

                newSequents.push(newSequent);
            });
        }
    });

    return newSequents;
}

function applyLeftNegationRule(sequent) {
    const newSequents = [];

    sequent.antecedent.formulas.forEach((formula, index) => {
        if (formula.operators.includes("¬")) {
            const negatedFormula = formula.atomicFormulas[0]; // Assuming the negation applies to a single formula

            const newAntecedentFormulas = [...sequent.antecedent.formulas];
            newAntecedentFormulas.splice(index, 1); // Remove the negated formula from the antecedent

            const newConsequentFormulas = [...sequent.consequent.formulas, negatedFormula];

            const newSequent = {
                type: "Sequent",
                antecedent: {
                    type: "Antecedent",
                    formulas: newAntecedentFormulas
                },
                consequent: {
                    type: "Consequent",
                    formulas: newConsequentFormulas
                }
            };

            newSequents.push(newSequent);
        }
    });

    return newSequents;
}

function applyRightNegationRule(sequent) {
    const newSequents = [];

    sequent.consequent.formulas.forEach((formula, index) => {
        if (formula.operators.includes("¬")) {
            const negatedFormula = formula.atomicFormulas[0]; // Assuming the negation applies to a single formula

            const newConsequentFormulas = [...sequent.consequent.formulas];
            newConsequentFormulas.splice(index, 1); // Remove the negated formula from the consequent

            const newAntecedentFormulas = [...sequent.antecedent.formulas, negatedFormula];

            const newSequent = {
                type: "Sequent",
                antecedent: {
                    type: "Antecedent",
                    formulas: newAntecedentFormulas
                },
                consequent: {
                    type: "Consequent",
                    formulas: newConsequentFormulas
                }
            };

            newSequents.push(newSequent);
        }
    });

    return newSequents;
}

function applyLeftImplicationRule(sequent) {
    const newSequents = [];

    sequent.antecedent.formulas.forEach((formula, index) => {
        if (formula.operators.includes("→")) {
            const [leftFormula, rightFormula] = formula.atomicFormulas;

            // Create a new sequent with leftFormula moved to the consequent
            const sequentWithLeftInConsequent = {
                type: "Sequent",
                antecedent: {
                    type: "Antecedent",
                    formulas: sequent.antecedent.formulas.filter((_, i) => i !== index)
                },
                consequent: {
                    type: "Consequent",
                    formulas: [...sequent.consequent.formulas, leftFormula]
                }
            };

            // Create a new sequent with rightFormula added to the antecedent
            const sequentWithRightInAntecedent = {
                type: "Sequent",
                antecedent: {
                    type: "Antecedent",
                    formulas: [...sequent.antecedent.formulas, rightFormula]
                },
                consequent: sequent.consequent
            };

            newSequents.push(sequentWithLeftInConsequent, sequentWithRightInAntecedent);
        }
    });

    return newSequents;
}

function applyRightImplicationRule(sequent) {
    // Find a formula in the consequent that contains an "→" operator
    for (const formula of sequent.consequent.formulas) {
        const implicationIndex = formula.operators.indexOf("→");
        if (implicationIndex !== -1) {
            const [leftFormula, rightFormula] = formula.atomicFormulas
            // Create a new sequent with leftFormula added to the antecedent
            // and rightFormula replacing the implication in the consequent
            const newAntecedentFormulas = [...sequent.antecedent.formulas, leftFormula];
            const newConsequentFormulas = sequent.consequent.formulas.map(f => 
            f === formula ? rightFormula : f);

            const newSequent = {
                type: "Sequent",
                antecedent: {
                    type: "Antecedent",
                    formulas: newAntecedentFormulas
                },
                consequent: {
                    type: "Consequent",
                    formulas: newConsequentFormulas
                }
            };

            return newSequent;
        }
    }

    // Return the original sequent if no implication is found
    return sequent;
}

function applyCutRule(sequent1, sequent2) {
    // Assuming that sequent1 is of the form A ⊢ B
    // and sequent2 is of the form B ⊢ C
    // We derive the new sequent A ⊢ C
    const cutFormula = sequent1.consequent.formulas[0]; // The formula B to be cut

    // Check if the cut formula appears in the antecedent of sequent2
    const cutFormulaExistsInSequent2 = sequent2.antecedent.formulas.some(
        formula => JSON.stringify(formula) === JSON.stringify(cutFormula)
        );

    if (!cutFormulaExistsInSequent2) {
        return null; // Cut rule cannot be applied if B is not in the antecedent of sequent2
    }

    // Create a new sequent with the antecedent of sequent1 and consequent of sequent2
    const newSequent = {
        type: "Sequent",
        antecedent: sequent1.antecedent,
        consequent: sequent2.consequent
    };

    return newSequent;
}
function applyIdentityRule(sequent) {
    // Check for a common formula in both the antecedent and consequent
    console.log(sequent);
    for (const formulaInAntecedent of sequent.antecedent.formulas) {
        for (const formulaInConsequent of sequent.consequent.formulas) {
            if (JSON.stringify(formulaInAntecedent) === JSON.stringify(formulaInConsequent)) {
                // A formula is found in both antecedent and consequent
                return {
                    type: "Sequent",
                    antecedent: {
                        type: "Antecedent",
                        formulas: [formulaInAntecedent]
                    },
                    consequent: {
                        type: "Consequent",
                        formulas: [formulaInConsequent]
                    }
                };
            }
        }
    }

    return 'null'; // Identity rule cannot be applied
}
function parseAndVisit(input) {
    const lexingResult = SequentsLexer.tokenize(input);
    parserInstance.input = lexingResult.tokens;
    const cst = parserInstance.sequent();

    if (parserInstance.errors.length > 0) {
        throw new Error('Parsing errors detected');
    }

    // Create an instance of the visitor
    const visitor = new AstBuilder();

    // Visit the CST and process it
    return visitor.visit(cst);
}

function printAst(node) {
    if (!node) return '';

    // Check if the input is an array and process each element
    if (Array.isArray(node)) {
        return node.map(printAst).join('\n');
    }

    switch (node.type) {
        case 'Sequent':
            return printAst(node.antecedent) + ' ⊢ ' + printAst(node.consequent);
            case 'Antecedent':
                return node.formulas.map(printAst).join(', ');
                case 'Consequent':
                    return node.formulas.map(printAst).join(', ');
                    case 'Formula':
                        return node.atomicFormulas.map(printAst).join(' ' + node.operators.join(' ') + ' ');
                        case 'AtomicFormula':
                            return node.value;
                            // Add cases for other types if needed
        default:
            return '';
    }
}

let inputText = "B  ⊢ D ∧ C"; // Example input
console.log(inputText)
const result = parseAndVisit(inputText);
console.log(result);

const newSequents = applyRightConjunctionRule(result);
console.log(printAst(newSequents));

export {parseInput, printAst, applyRightConjunctionRule, parseAndVisit, applyLeftConjunctionRule,
    applyRightDisjunctionRule, applyLeftDisjunctionRule, applyLeftImplicationRule, applyLeftNegationRule, applyRightImplicationRule, applyRightNegationRule, applyCutRule, applyIdentityRule}
