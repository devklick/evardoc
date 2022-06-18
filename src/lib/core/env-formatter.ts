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

const addComment = (lines: string[], key: string, value: unknown | null) => {
  if (value) {
    // In some cases the value is an array. We need to convert that to strings with line breaks,
    // where each line (other than the first), is preceded with a comment hash
    const formattedValue = Array.isArray(value)
      ? value.join(`${EOL}# `)
      : value;
    lines.push(`# ${key}: ${formattedValue}`);
  }
};
const addEvar = (lines: string[], key: string, value: string | null) => {
  lines.push(`${key}=${value ?? ""}`);
};
const addBlock = (
  blocks: string[],
  evar: ParsedEvar,
  excludeVariableValues: boolean
) => {
  if (evar.errors.some((e) => e.severity !== "warning")) return;
  const lines: string[] = [];
  addComment(lines, EvarDocKeys.description, evar.description);
  addComment(lines, EvarDocKeys.type, evar.type);
  addComment(lines, EvarDocKeys.requirement, evar.requirement);
  addComment(lines, EvarDocKeys.default, evar.default);
  addComment(lines, EvarDocKeys.example, evar.example);
  addEvar(lines, evar.name, excludeVariableValues ? null : evar.value);
  blocks.push(lines.join(EOL));
};

/**
 * Formats the parsed environment variable data
 * @param evarVariables The parsed environment variables, including the comments that decorate them
 * @param excludeVariableValues Whether or not the variable values should be excluded from the formatted data.
 * @param templateEvarVariables The parsed variables from the existing template.
 * This is intended to be specified when merging the environment files from the env file with the ones on the existing template
 * @returns The formatted environment variable, as a string, ready to be dumped to a file
 */
export const applyFormat = (
  evarVariables: ParsedEvar[],
  excludeVariableValues: boolean = false,
  templateEvarVariables: ParsedEvar[] | null = null
): string => {
  const blocks: string[] = [];

  // If we variables from an existing template, they come first.
  // Any variables from the environment file get appended to the bottom of the content
  if (templateEvarVariables)
    templateEvarVariables.forEach((evar) =>
      addBlock(blocks, evar, excludeVariableValues)
    );

  // For each of the actual environment variables,
  // if we have existing template variables and the variable is not already in the template,
  // or we don't have existing template variables, add the variable as a new block
  evarVariables.forEach((evar) => {
    if (
      !templateEvarVariables ||
      (templateEvarVariables &&
        !templateEvarVariables.some((e) => e.name === evar.name))
    ) {
      addBlock(blocks, evar, excludeVariableValues);
    }
  });
  return blocks.join(EOL + EOL);
};

/**
 * Formats the environment variable data and excludes the variable values.
 * This is intended to be used when creating an .env template
 * @param parsedEvars The parsed environment variables, including the comments that decorate them
 * @param existingTemplateParsedEvars The parsed variables from the existing template.
 * This is intended to be specified when merging the environment files from the env file with the ones on the existing template
 * @returns The formatted environment variable, as a string, ready to be dumped to a file
 */
export const formatTemplate = (
  parsedEvars: ParsedEvar[],
  existingTemplateParsedEvars: ParsedEvar[] | null = null
) => applyFormat(parsedEvars, true, existingTemplateParsedEvars);
