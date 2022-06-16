import { format } from "../../core/env-formatter";
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
  console.log("Executing refactor command");
  const parsed = await parse(envFilePath);
  if (!parsed.success)
    throw new Error("Parsing failed. Worry about this later");
  const formatted = format(parsed.variables);
  await write(formatted, envFilePath);
};

/**
 * The metatdata assciated with the command.
 */
export const refactorCommandMetadata: EvarDocCommandMetadata = {
  command: "refactor",
  description: "Refactor an environment file, applying opinionated formatting",
  argument: {
    name: "src",
    description: "The path to the environment file to be refactored",
    required: true,
  },
  action,
};

/**
 * Builds the command that is used to refactor an environment file
 * @param program The commander program
 */
const refactor: EvarDocCommand = (program): void =>
  registerCommand(program, refactorCommandMetadata);

export default refactor;
