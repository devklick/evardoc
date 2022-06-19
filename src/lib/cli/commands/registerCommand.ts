import { Command } from "commander";
import {
  EvarDocCommandArgument,
  EvarDocCommandMetadata,
  EvarDocCommandOption,
} from "./types";
const addRequirementParens = (value: string, required: boolean) => {
  return required ? `<${value}>` : `[${value}]`;
};

const argName = (argument: EvarDocCommandArgument): string => {
  return argument.required ? `<${argument.name}>` : `[${argument.name}]`;
};
const optionFlags = (option: EvarDocCommandOption): string => {
  const valueTemplate = option.boolean
    ? ""
    : addRequirementParens(option.shortName, option.required);
  return `-${option.shortName}, --${option.fullName} ${valueTemplate}`;
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

  metadata.options?.forEach((option) => {
    _program.option(optionFlags(option), option.description, option.default);
  });
};

export default registerCommand;
