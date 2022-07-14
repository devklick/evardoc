import { formatTemplate } from "../../core/env-formatter";
import { parse, tryParse } from "../../core/env-parser";
import { write } from "../../core/env-writer";
import { logParseResult } from "../../core/logger";
import registerCommand from "./register-command";
import {
  EvarDocCommand,
  EvarDocCommandAction,
  EvarDocCommandMetadata,
} from "./types";

export type Options = {
  overwrite: boolean;
  destination: string;
  verbose: boolean;
};

/**
 * The action to be used when this command is executed.
 * Gets the data from the environment file, formats it, and writes it to a template, excluding the environment variable values.
 * Depending on the `overwrite` option, the existing template (if there is one) will either be completely overwritten
 * or appended to with any new variables from the actual environment file.
 * @param envFilePath The path to the environment file
 */
export const action: EvarDocCommandAction<Options> = async (
  envFilePath,
  { overwrite, destination, verbose }
) => {
  const parsed = await parse(envFilePath);
  logParseResult(envFilePath, parsed, verbose);
  if (!parsed.success) process.exit(1);
  const existing = overwrite ? null : await tryParse(destination);
  if (existing) {
    logParseResult(destination, existing, verbose);
    if (!existing.success) process.exit(1);
  }
  const formatted = formatTemplate(parsed.variables, existing?.variables);
  await write(formatted, destination);
};

/**
 * The metatdata associated with the command.
 */
export const templateCommandMetadata: EvarDocCommandMetadata<Options> = {
  command: "template",
  description:
    "Create a new environment file template from an existing environment file. " +
    "Takes the EvarDoc comments and environment variable names (not values) from the environment file, formats them, and writes them to a template file.",
  argument: {
    name: "src",
    description:
      "The path to the environment to be used as the source of data for the template",
    required: false,
    default: ".env",
  },
  options: [
    {
      fullName: "overwrite",
      shortName: "o",
      description:
        "Whether or not the existing template (if one exists), should be overwritten with the template content based on the environment file. " +
        "Without this option, only new environment variable information will be written to the bottom of the template, if one already exists",
      default: false,
      required: false,
      boolean: true,
    },
    {
      fullName: "destination",
      shortName: "d",
      description: "The file that he template should be saved to",
      default: "template.env",
      required: false,
      boolean: false,
    },
    {
      fullName: "verbose",
      shortName: "v",
      description: "Whether or not verbose logs should be written out",
      default: false,
      required: false,
      boolean: true,
    },
  ],
  action,
};

/**
 * Builds the command that is used to create an environment file template from an existing environment file.
 * @param program The commander program
 */
export const register: EvarDocCommand = (program) =>
  registerCommand(program, templateCommandMetadata);
