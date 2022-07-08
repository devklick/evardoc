import { Command } from "commander";
import {
  EvarDocCommandArgument,
  EvarDocCommandMetadata,
  EvarDocCommandOption,
} from "./types";
export const addRequirementParens = (
  value: string,
  required: boolean
): string => {
  return required ? `<${value}>` : `[${value}]`;
};

export const argName = (argument: EvarDocCommandArgument): string =>
  addRequirementParens(argument.name, argument.required);

export const optionFlags = (option: EvarDocCommandOption): string => {
  const valueTemplate = option.boolean
    ? ""
    : addRequirementParens(option.shortName, option.required);

  let value = `-${option.shortName}, --${option.fullName}`;
  if (valueTemplate) value += ` ${valueTemplate}`;
  return value;
};

const registerCommand = <Options>(
  program: Command,
  metadata: EvarDocCommandMetadata<Options>
) => {
  const _program = program
    .command(metadata.command)
    .description(metadata.description)
    .argument(
      argName(metadata.argument),
      metadata.argument.description,
      metadata.argument.default
    )
    .action(metadata.action);

  program.description;

  metadata.options?.forEach((option) => {
    _program.option(optionFlags(option), option.description, option.default);
  });
};

export default registerCommand;
