import { applyFormat } from "../../core/env-formatter";
import { parse } from "../../core/env-parser";
import { write } from "../../core/env-writer";
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
  console.log("Executing format command");
  const parsed = await parse(envFilePath);
  if (!parsed.success)
    throw new Error("Parsing failed. Worry about this later");
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
    required: true,
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
