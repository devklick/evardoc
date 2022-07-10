import { applyFormat } from "../../core/env-formatter";
import { parse } from "../../core/env-parser";
import { write } from "../../core/env-writer";
import { logParseResult } from "../../core/logger";
import registerCommand from "./register-command";
import {
  EvarDocCommand,
  EvarDocCommandAction,
  EvarDocCommandMetadata,
} from "./types";

export type Options = {
  verbose: boolean;
};

/**
 * The action to be used when this command is executed.
 * Parses the specified environment file, formats it, and saves the formatted content to the same environment file.
 * @param envFilePath The path to the environment file
 */
export const action: EvarDocCommandAction<Options> = async (
  envFilePath,
  { verbose }
) => {
  const parsed = await parse(envFilePath);
  logParseResult(envFilePath, parsed, verbose);
  if (!parsed.success) process.exit(1);
  const formatted = applyFormat(parsed.variables);
  await write(formatted, envFilePath);
};

/**
 * The metatdata associated with the command.
 */
export const formatCommandMetadata: EvarDocCommandMetadata<Options> = {
  command: "format",
  description: "Format an environment file, applying opinionated formatting",
  argument: {
    name: "src",
    description: "The path to the environment file to be formatted",
    required: false,
    default: ".env",
  },
  action,
  options: [
    {
      fullName: "verbose",
      shortName: "v",
      description: "Whether or not verbose logs should be written out",
      default: false,
      required: false,
      boolean: true,
    },
  ],
};

/**
 * Builds the command that is used to format an environment file
 * @param program The commander program
 */
export const register: EvarDocCommand = (program): void =>
  registerCommand(program, formatCommandMetadata);
