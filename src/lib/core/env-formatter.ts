import { ParsedEvar } from "./env-parser";
import { EvarDocKeys } from "./types";
import { EOL } from "os";

/*
  ========================================================================================================
  This module is responsible for formatting parsed environment file data.
  Data returned from the env-parser module should be passed in here if it's to be formatted.
  The data returned from this module can be passed to the env-writer module if it's to be written to file.
  ========================================================================================================
*/
/**
 * Formats the pased environment variable data
 * @param parsedEvars The parsed environment variables, including the comments that decorate them
 * @param excludeVariableValues Whether or not the variable values should be excluded from the formatted data.
 * @returns The formatted environment variable, as a string, ready to be dumped to a file
 */
export const format = (
  parsedEvars: ParsedEvar[],
  excludeVariableValues: boolean = false
): string => {
  const blocks: string[] = [];
  const addComment = (lines: string[], key: string, value: unknown | null) => {
    if (value) lines.push(`# ${key}: ${value}`);
  };
  const addEvar = (lines: string[], key: string, value: string | null) => {
    lines.push(`${key}=${value ?? ""}`);
  };
  parsedEvars.forEach((evar) => {
    if (evar.errors.length) return;
    const lines: string[] = [];
    addComment(lines, EvarDocKeys.description, evar.description);
    addComment(lines, EvarDocKeys.type, evar.type);
    addComment(lines, EvarDocKeys.requirement, evar.requirement);
    addComment(lines, EvarDocKeys.default, evar.default);
    addComment(lines, EvarDocKeys.example, evar.example);
    addEvar(lines, evar.name, excludeVariableValues ? null : evar.value);
    blocks.push(lines.join(EOL));
  });
  return blocks.join(EOL + EOL);
};

/**
 * Formats the environment variable data and excludes the variable values.
 * This is intended to be used when creating an .env template
 * @param parsedEvars The parsed environment variables, including the comments that decorate them
 * @returns The formatted environment variable, as a string, ready to be dumped to a file
 */
export const formatTemplate = (parsedEvars: ParsedEvar[]) =>
  format(parsedEvars, true);
