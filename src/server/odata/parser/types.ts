import { Token } from './lexer';

export interface QueryOptionsNode extends Token {
  value: Array<Token>;
}