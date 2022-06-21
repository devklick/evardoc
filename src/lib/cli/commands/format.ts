import { applyFormat } from "../../core/env-formatter";
import { parse } from "../../core/env-parser";
import { write } from "../../core/env-writer";
import { logParseResult } from "../../core/logger";
import registerCommand from "./registerCommand";
import {
  EvarDocCommand,
  EvarDocCommandAction,
  EvarDocCommandMetadata,
} from "./types";

/**
 * The action to be used when this command is executed.
 * Parses the specified environment file, formats it, and saves the formatted content to the same environment file.
 * @param envFilePath The path to the environment file
 */
const action: EvarDocCommandAction = async (envFilePath) => {
  const parsed = await parse(envFilePath);
  logParseResult(envFilePath, parsed, true); // TODO: Replace hardcoded verbose with CLI option
  if (!parsed.success) process.exit(1);
  const formatted = applyFormat(parsed.variables);
  await write(formatted, envFilePath);
};

/**
 * The metatdata associated with the command.
 */
export const formatCommandMetadata: EvarDocCommandMetadata = {
  command: "format",
  description: "format an environment file, applying opinionated formatting",
  argument: {
    name: "src",
    description: "The path to the environment file to be formatted",
    required: false,
    default: ".env",
  },
  action,
};

/**
 * Builds the command that is used to format an environment file
 * @param program The commander program
 */
const format: EvarDocCommand = (program): void =>
  registerCommand(program, formatCommandMetadata);

export default format;
