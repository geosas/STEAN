// import { PrimitiveTypeEnum } from '@odata/metadata';
import { Token, TokenType } from './lexer';

export interface QueryOptionsToken extends Token {
  type: TokenType.QueryOptions;
  value: {
    options: Token[];
  };
}

export interface CustomQueryOptionToken extends Token {
  type: TokenType.CustomQueryOption;
  value: {
    key: string;
    value: any;
  };
}

export interface LiteralToken extends Token {
  type: TokenType.Literal;
  /**
   * edm type
   */
//   value: PrimitiveTypeEnum;
}

export interface SkipToken extends Token {
  type: TokenType.Skip;
  value: LiteralToken;
}

export interface TopToken extends Token {
  type: TokenType.Top;
  value: LiteralToken;
}

export interface FormatToken extends Token {
  type: TokenType.Format;
  value: { format: string };
}

export interface FilterToken extends Token {
  type: TokenType.Filter;
  value: EqualsExpressionToken | OrExpressionToken | AndExpressionToken;
}

export interface ExpandToken extends Token {
  type: TokenType.Expand;
  value: {
    items: Token[];
  };
}

export interface SearchToken extends Token {
  type: TokenType.Search;
  value: SearchWordToken;
}

export interface SearchWordToken extends Token {
  type: TokenType.SearchWord;
  value: string;
}

export interface LeftRightExpressionToken extends Token {
  value: {
    left: Token;
    right: Token;
  };
}

export interface MemberExpressionToken extends Token {
  type: TokenType.MemberExpression;
  value: Token;
}

export interface FirstMemberExpressionToken extends Token {
  type: TokenType.FirstMemberExpression;
  value: Token;
}

export interface EqualsExpressionToken extends LeftRightExpressionToken {
  type: TokenType.EqualsExpression;
}

export interface AndExpressionToken extends LeftRightExpressionToken {
  type: TokenType.AndExpression;
}

export interface OrExpressionToken extends LeftRightExpressionToken {
  type: TokenType.OrExpression;
}
