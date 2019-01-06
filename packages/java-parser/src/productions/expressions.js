"use strict";
function defineRules($, t) {
  $.RULE("constantExpression", () => {
    $.SUBRULE($.expression);
  });

  $.RULE("expression", () => {
    $.OR([
      {
        GATE: () => this.BACKTRACK_LOOKAHEAD($.isLambdaExpression),
        ALT: () => $.SUBRULE($.lambdaExpression)
      },
      { ALT: () => $.SUBRULE($.assignmentExpression) }
    ]);
  });

  // https://docs.oracle.com/javase/specs/jls/se11/html/jls-15.html#jls-LambdaExpression
  $.RULE("lambdaExpression", () => {
    $.SUBRULE($.lambdaParameters);
    $.CONSUME(t.Arrow);
    $.SUBRULE($.lambdaBody);
  });

  $.RULE("lambdaParameters", () => {
    $.OR([
      { ALT: () => $.SUBRULE($.lambdaParametersWithBraces) },
      { ALT: () => $.CONSUME(t.Identifier) }
    ]);
  });

  $.RULE("lambdaParametersWithBraces", () => {
    $.CONSUME(t.LBrace);
    $.OPTION(() => {
      $.SUBRULE($.lambdaParameterList);
    });
    $.CONSUME(t.RBrace);
  });

  $.RULE("lambdaParameterList", () => {
    $.OR([
      {
        GATE: () => {
          const nextTokType = this.LA(1).tokenType;
          const nextNextTokType = this.LA(2).tokenType;
          return (
            nextTokType === t.Identifier &&
            (nextNextTokType === t.RBrace || nextNextTokType === t.Comma)
          );
        },
        ALT: () => $.SUBRULE($.inferredLambdaParameterList)
      },
      { ALT: () => $.SUBRULE($.explicitLambdaParameterList) }
    ]);
  });

  $.RULE("inferredLambdaParameterList", () => {
    $.CONSUME(t.Identifier);
    $.MANY(() => {
      $.CONSUME(t.Comma);
      $.CONSUME2(t.Identifier);
    });
  });

  $.RULE("explicitLambdaParameterList", () => {
    $.SUBRULE($.lambdaParameter);
    $.MANY(() => {
      $.CONSUME(t.Comma);
      $.SUBRULE2($.lambdaParameter);
    });
  });

  $.RULE("lambdaParameter", () => {
    $.OR([
      {
        GATE: $.BACKTRACK($.regularLambdaParameter),
        ALT: () => $.SUBRULE($.regularLambdaParameter)
      },
      { ALT: () => $.SUBRULE($.variableArityParameter) }
    ]);
  });

  $.RULE("regularLambdaParameter", () => {
    $.MANY(() => {
      $.SUBRULE($.variableModifier);
    });
    $.SUBRULE($.lambdaParameterType);
    $.SUBRULE($.variableDeclaratorId);
  });

  $.RULE("lambdaParameterType", () => {
    $.OR([
      { ALT: () => $.SUBRULE($.unannType) },
      { ALT: () => $.CONSUME(t.Var) }
    ]);
  });

  $.RULE("lambdaBody", () => {
    $.OR([
      { ALT: () => $.SUBRULE($.expression) },
      { ALT: () => $.SUBRULE($.block) }
    ]);
  });

  $.RULE("assignmentExpression", () => {
    $.SUBRULE($.binaryExpression);
    $.OPTION(() => {
      $.CONSUME(t.QuestionMark);
      $.SUBRULE($.assignmentExpression);
      $.CONSUME(t.Colon);
      $.SUBRULE2($.assignmentExpression);
    });
  });

  $.RULE("binaryExpression", () => {
    $.SUBRULE($.unaryExpression);
    $.MANY(() => {
      $.CONSUME(t.BinaryOperator);
      $.SUBRULE2($.unaryExpression);
    });
  });

  $.RULE("unaryExpression", () => {
    $.MANY(() => {
      $.CONSUME(t.UnaryPrefixOperator);
    });
    $.SUBRULE($.primary);
    $.MANY2(() => {
      $.CONSUME(t.UnarySuffixOperator);
    });
  });

  $.RULE("unaryExpressionNotPlusMinus", () => {
    $.MANY(() => {
      $.CONSUME(t.UnaryPrefixOperatorNotPlusMinus);
    });
    $.SUBRULE($.primary);
    $.MANY2(() => {
      $.CONSUME(t.UnarySuffixOperator);
    });
  });

  $.RULE("primary", () => {
    $.SUBRULE($.primaryPrefix);
    $.MANY(() => {
      $.SUBRULE($.primarySuffix);
    });
  });

  $.RULE("primaryPrefix", () => {
    let isCastExpression = false;
    if ($.LA(1).tokenType === t.LBrace) {
      isCastExpression = this.BACKTRACK_LOOKAHEAD($.isCastExpression);
    }

    $.OR([
      { ALT: () => $.SUBRULE($.literal) },
      { ALT: () => $.CONSUME(t.This) },
      { ALT: () => $.CONSUME(t.Void) },
      // should be extracted to primitive type with optional dims suffix?
      { ALT: () => $.SUBRULE($.numericType) },
      { ALT: () => $.CONSUME(t.Boolean) },
      { ALT: () => $.SUBRULE($.fqnOrRefType) },
      {
        GATE: () => isCastExpression,
        ALT: () => $.SUBRULE($.castExpression)
      },
      { ALT: () => $.SUBRULE($.parenthesisExpression) },
      { ALT: () => $.SUBRULE($.newExpression) }
    ]);
  });

  $.RULE("primarySuffix", () => {
    $.OR([
      {
        ALT: () => {
          $.CONSUME(t.Dot);
          $.OR2([
            { ALT: () => $.CONSUME(t.This) },
            {
              ALT: () => $.SUBRULE($.unqualifiedClassInstanceCreationExpression)
            },
            // TODO: this should probably not be preceded by a "dot"
            { ALT: () => $.CONSUME(t.Identifier) }
          ]);
        }
      },
      { ALT: () => $.SUBRULE($.methodInvocationSuffix) },
      { ALT: () => $.SUBRULE($.classLiteralSuffix) },
      { ALT: () => $.SUBRULE($.arrayAccessSuffix) },
      { ALT: () => $.SUBRULE($.methodReferenceSuffix) }
    ]);
  });

  $.RULE("fqnOrRefType", () => {
    $.SUBRULE($.fqnOrRefTypePart);

    $.MANY2({
      // ".class" is a classLiteralSuffix
      GATE: () => this.LA(2).tokenType !== t.Class,
      DEF: () => {
        $.CONSUME(t.Dot);
        $.SUBRULE2($.fqnOrRefTypePart);
      }
    });
  });

  // TODO: validation:
  //       1. "annotation" cannot be mixed with "methodTypeArguments" or "Super".
  //       2. "methodTypeArguments" cannot be mixed with "classTypeArguments" or "annotation".
  //       3. "Super" cannot be mixed with "classTypeArguments" or "annotation".
  //       4. At most one "Super" may be used.
  //       5. "Super" may be last or one before last (last may also be first if there is only a single part).
  $.RULE("fqnOrRefTypePart", () => {
    $.MANY(() => {
      $.SUBRULE($.annotation);
    });

    $.OPTION({
      NAME: "$methodTypeArguments",
      DEF: () => {
        $.SUBRULE2($.typeArguments);
      }
    });

    $.OR([
      { ALT: () => $.CONSUME(t.Identifier) },
      { ALT: () => $.CONSUME(t.Super) }
    ]);

    let isRefTypeInMethodRef = false;
    // Performance optimization, only perform this backtracking when a '<' is found
    // TODO: performance optimization evaluation: avoid doing this backtracking for every "<" encountered.
    //       we could do it once (using global state) per "fqnOrRefType"
    // We could do it only once for
    if ($.LA(1).tokenType === t.Less) {
      isRefTypeInMethodRef = this.BACKTRACK_LOOKAHEAD($.isRefTypeInMethodRef);
    }

    $.OPTION2({
      NAME: "$classTypeArguments",
      // unrestricted typeArguments here would create an ambiguity with "LessThan" operator
      // e.g: "var x = a < b;"
      // The "<" would be parsed as the beginning of a "typeArguments"
      // and we will get an error: "expecting '>' but found: ';'"
      GATE: () => isRefTypeInMethodRef,
      DEF: () => {
        $.SUBRULE3($.typeArguments);
      }
    });
  });

  $.RULE("parenthesisExpression", () => {
    $.CONSUME(t.LBrace);
    $.SUBRULE($.expression);
    $.CONSUME(t.RBrace);
  });

  $.RULE("castExpression", () => {
    $.OR([
      {
        // TODO: can avoid backtracking again here, parent rule could have this information
        //       when it checks isCastExpression (refactor needed)
        GATE: () => this.BACKTRACK_LOOKAHEAD($.isPrimitiveCastExpression),
        ALT: () => $.SUBRULE($.primitiveCastExpression)
      },
      { ALT: () => $.SUBRULE($.referenceTypeCastExpression) }
    ]);
  });

  $.RULE("primitiveCastExpression", () => {
    $.CONSUME(t.LBrace);
    $.SUBRULE($.primitiveType);
    $.CONSUME(t.RBrace);
    $.SUBRULE($.unaryExpression);
  });

  $.RULE("referenceTypeCastExpression", () => {
    $.CONSUME(t.LBrace);
    $.SUBRULE($.referenceType);
    $.MANY(() => {
      $.SUBRULE($.additionalBound);
    });
    $.CONSUME(t.RBrace);
    $.OR([
      {
        GATE: () => this.BACKTRACK_LOOKAHEAD($.isLambdaExpression),
        ALT: () => $.SUBRULE($.lambdaExpression)
      },
      { ALT: () => $.SUBRULE($.unaryExpressionNotPlusMinus) }
    ]);
  });

  const newExpressionTypes = {
    arrayCreationExpression: 1,
    unqualifiedClassInstanceCreationExpression: 2
  };
  $.RULE("newExpression", () => {
    const type = this.BACKTRACK_LOOKAHEAD($.identifyNewExpressionType);

    $.OR([
      {
        GATE: () => type === newExpressionTypes.arrayCreationExpression,
        ALT: () => $.SUBRULE($.arrayCreationExpression)
      },
      {
        GATE: () =>
          type ===
          newExpressionTypes.unqualifiedClassInstanceCreationExpression,
        ALT: () => $.SUBRULE($.unqualifiedClassInstanceCreationExpression)
      }
    ]);
  });

  // https://docs.oracle.com/javase/specs/jls/se11/html/jls-15.html#jls-UnqualifiedClassInstanceCreationExpression
  $.RULE("unqualifiedClassInstanceCreationExpression", () => {
    $.CONSUME(t.New);
    $.OPTION(() => {
      $.SUBRULE($.typeArguments);
    });
    $.SUBRULE($.classOrInterfaceTypeToInstantiate);
    $.CONSUME(t.LBrace);
    $.OPTION2(() => {
      $.SUBRULE($.argumentList);
    });
    $.CONSUME(t.RBrace);
    $.OPTION3(() => {
      $.SUBRULE($.classBody);
    });
  });

  $.RULE("classOrInterfaceTypeToInstantiate", () => {
    $.MANY(() => {
      $.SUBRULE($.annotation);
    });
    $.CONSUME(t.Identifier);
    $.MANY2(() => {
      $.CONSUME(t.Dot);
      $.MANY3(() => {
        $.SUBRULE2($.annotation);
      });
      $.CONSUME2(t.Identifier);
    });
    $.OPTION(() => {
      $.SUBRULE($.typeArgumentsOrDiamond);
    });
  });

  $.RULE("typeArgumentsOrDiamond", () => {
    $.OR([
      { ALT: () => $.SUBRULE($.diamond) },
      { ALT: () => $.SUBRULE($.typeArguments) }
    ]);
  });

  $.RULE("diamond", () => {
    $.CONSUME(t.Less);
    $.CONSUME(t.Greater);
  });

  $.RULE("methodInvocationSuffix", () => {
    $.CONSUME(t.LBrace);
    $.OPTION2(() => {
      $.SUBRULE($.argumentList);
    });
    $.CONSUME(t.RBrace);
  });

  $.RULE("argumentList", () => {
    $.SUBRULE($.expression);
    $.MANY(() => {
      $.CONSUME(t.Comma);
      $.SUBRULE2($.expression);
    });
  });

  $.RULE("arrayCreationExpression", () => {
    $.CONSUME(t.New);
    $.OR([
      {
        GATE: $.BACKTRACK($.primitiveType),
        ALT: () => $.SUBRULE($.primitiveType)
      },
      { ALT: () => $.SUBRULE($.classOrInterfaceType) }
    ]);

    $.OR2([
      {
        GATE: $.BACKTRACK($.arrayCreationDefaultInitSuffix),
        ALT: () => $.SUBRULE($.arrayCreationDefaultInitSuffix)
      },
      { ALT: () => $.SUBRULE($.arrayCreationExplicitInitSuffix) }
    ]);
  });

  $.RULE("arrayCreationDefaultInitSuffix", () => {
    $.SUBRULE($.dimExprs);
    $.OPTION(() => {
      $.SUBRULE($.dims);
    });
  });

  $.RULE("arrayCreationExplicitInitSuffix", () => {
    $.SUBRULE($.dims);
    $.SUBRULE($.arrayInitializer);
  });

  $.RULE("dimExprs", () => {
    $.SUBRULE($.dimExpr);
    $.OPTION(() => {
      $.SUBRULE2($.dimExpr);
    });
  });

  $.RULE("dimExpr", () => {
    $.MANY(() => {
      $.SUBRULE($.annotation);
    });
    $.CONSUME(t.LSquare);
    $.SUBRULE($.expression);
    $.CONSUME(t.RSquare);
  });

  $.RULE("classLiteralSuffix", () => {
    $.MANY(() => {
      $.CONSUME(t.LSquare);
      $.CONSUME(t.RSquare);
    });
    $.CONSUME(t.Dot);
    $.CONSUME(t.Class);
  });

  $.RULE("arrayAccessSuffix", () => {
    $.CONSUME(t.LSquare);
    $.SUBRULE($.expression);
    $.CONSUME(t.RSquare);
  });

  $.RULE("methodReferenceSuffix", () => {
    $.CONSUME(t.ColonColon);
    $.OPTION(() => {
      $.SUBRULE($.typeArguments);
    });

    $.OR([
      { ALT: () => $.CONSUME(t.Identifier) },
      // TODO: a constructor method reference ("new") can only be used
      //   in specific contexts, but perhaps this verification is best left
      //   for a semantic analysis phase
      { ALT: () => $.CONSUME(t.New) }
    ]);
  });

  // backtracking lookahead logic
  $.RULE("identifyNewExpressionType", () => {
    $.CONSUME(t.New);
    const firstTokenAfterNew = this.LA(1).tokenType;

    // not an array initialization due to the prefix "TypeArguments"
    if (firstTokenAfterNew === t.Less) {
      return newExpressionTypes.unqualifiedClassInstanceCreationExpression;
    }

    try {
      $.SUBRULE($.classOrInterfaceTypeToInstantiate);
    } catch (e) {
      // if it is not a "classOrInterfaceTypeToInstantiate" then
      // (assuming a valid input) we are looking at an "arrayCreationExpression"
      return newExpressionTypes.arrayCreationExpression;
    }

    const firstTokenAfterClassType = this.LA(1).tokenType;
    if (firstTokenAfterClassType === t.LBrace) {
      return newExpressionTypes.unqualifiedClassInstanceCreationExpression;
    }

    // The LBrace above is mandatory in "classInstanceCreation..." so
    // it must be an "arrayCreationExp" (if the input is valid)
    // TODO: upgrade the logic to return "unknown" type if at this
    //       point it does not match "arrayCreation" either.
    //   - This will provide a better error message to the user
    //     in case of invalid inputs
    return newExpressionTypes.arrayCreationExpression;
  });

  // Optimized backtracking, only scan ahead until the arrow("->").
  $.RULE("isLambdaExpression", () => {
    // TODO: this check of next two tokens is probably redundant as the normal lookahead should take care of this.
    const firstTokenType = this.LA(1).tokenType;
    const secondTokenType = this.LA(2).tokenType;
    // no parent lambda "x -> x * 2"
    if (firstTokenType === t.Identifier && secondTokenType === t.Arrow) {
      return true;
    }

    $.SUBRULE($.lambdaParametersWithBraces);
    const followedByArrow = this.LA(1).tokenType === t.Arrow;
    return followedByArrow;
  });

  $.RULE("isCastExpression", () => {
    if (this.BACKTRACK_LOOKAHEAD($.isPrimitiveCastExpression)) {
      return true;
    }
    return this.BACKTRACK_LOOKAHEAD($.isReferenceTypeCastExpression);
  });

  $.RULE("isPrimitiveCastExpression", () => {
    $.CONSUME(t.LBrace);
    $.SUBRULE($.primitiveType);
    // No dims so this is not a reference Type
    $.CONSUME(t.RBrace);
    return true;
  });

  let firstForUnaryExpressionNotPlusMinus = undefined;
  $.RULE("isReferenceTypeCastExpression", () => {
    if (firstForUnaryExpressionNotPlusMinus === undefined) {
      const firstUnaryExpressionNotPlusMinus = this.computeContentAssist(
        "unaryExpressionNotPlusMinus",
        []
      );
      const nextTokTypes = firstUnaryExpressionNotPlusMinus.map(
        x => x.nextTokenType
      );
      // uniq
      firstForUnaryExpressionNotPlusMinus = nextTokTypes.filter(
        (v, i, a) => a.indexOf(v) === i
      );
    }
    $.CONSUME(t.LBrace);
    $.SUBRULE($.referenceType);
    $.MANY(() => {
      $.SUBRULE($.additionalBound);
    });
    $.CONSUME(t.RBrace);
    const firstTokTypeAfterRBrace = this.LA(1).tokenType;

    return (
      firstForUnaryExpressionNotPlusMinus.find(
        tokType => tokType === firstTokTypeAfterRBrace
      ) !== undefined
    );
  });

  $.RULE("isRefTypeInMethodRef", () => {
    $.SUBRULE($.typeArguments);

    // arrayType
    const hasDims = $.OPTION(() => {
      $.SUBRULE($.dims);
    });

    const firstTokTypeAfterTypeArgs = this.LA(1).tokenType;
    if (firstTokTypeAfterTypeArgs === t.ColonColon) {
      return true;
    }
    // we must be at the end of a "referenceType" if "dims" were encountered
    // So there is not point to check farther
    else if (hasDims) {
      return false;
    }

    // in the middle of a "classReferenceType"
    $.OPTION2(() => {
      $.CONSUME(t.Dot);
      $.SUBRULE($.classOrInterfaceType);
    });

    const firstTokTypeAfterRefType = this.LA(1).tokenType;
    return firstTokTypeAfterRefType === t.ColonColon;
  });
}

module.exports = {
  defineRules
};