import { formatTemplate } from "../../core/env-formatter";
import { parse, tryParse } from "../../core/env-parser";
import { write } from "../../core/env-writer";
import registerCommand from "./registerCommand";
import {
  EvarDocCommand,
  EvarDocCommandAction,
  EvarDocCommandMetadata,
} from "./types";

export type Options = {
  overwrite: boolean;
  destination: string;
};

/**
 * The action to be used when this command is executed.
 * Gets the data from the environment file, formats it, and writes it to a template, excluding the environment variable values.
 * Depending on the `overwrite` option, the existing template (if there is one) will either be completely overwritten
 * or appended to with any new variables from the actual environment file.
 * @param envFilePath The path to the environment file
 */
const action: EvarDocCommandAction<Options> = async (
  envFilePath,
  { overwrite, destination }
) => {
  const parsed = await parse(envFilePath);
  if (!parsed.success)
    throw new Error("Parsing failed. Worry about this later");

  const existing = overwrite ? null : await tryParse("template.env");
  const formatted = formatTemplate(parsed.variables, existing?.variables);
  await write(formatted, destination);
};

/**
 * The metatdata associated with the command.
 */
export const templateCommandMetadata: EvarDocCommandMetadata<Options> = {
  command: "template",
  description: `Create a new environment file template from an existing environment file. 
      Takes the EvarDoc comments and environment variable names (not values) from the environment file, formats them, and writes them to a template file.`,
  argument: {
    name: "src",
    description:
      "The path to the environment to be used as the source of data for the template",
    required: false,
    default: ".env",
  },
  options: [
    {
      shortName: "o",
      fullName: "overwrite",
      description: `Whether or not the existing template (if one exists), should be overwritten with the template content based on the environment file
        Without this option, only new environment variable information will be written to the bottom of the template, if one already exists`,
      default: false,
      required: false,
      boolean: true,
    },
    {
      shortName: "d",
      fullName: "destination",
      description: "The file that he template should be saved to",
      default: "template.env",
      required: false,
      boolean: false,
    },
  ],
  action,
};

/**
 * Builds the command that is used to create an environment file template from an existing environment file.
 * @param program The commander program
 */
const template: EvarDocCommand = (program) =>
  registerCommand(program, templateCommandMetadata);

export default template;
