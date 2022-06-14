import { Command } from "commander";
import {
  EvarDocCommandArgument,
  EvarDocCommandMetadata,
  EvarDocCommandOption,
} from "./types";

const argName = (argument: EvarDocCommandArgument): string => {
  return argument.required ? `<${argument.name}>` : `[${argument.name}]`;
};
const optionFlags = (option: EvarDocCommandOption): string => {
  return `-${option.shortName}, --${option.fullName}`;
};

const registerCommand = <Options>(
  program: Command,
  metadata: EvarDocCommandMetadata<Options>
) => {
  program
    .command(metadata.command)
    .description(metadata.description)
    .argument(argName(metadata.argument), metadata.description);

  metadata.options?.forEach((option) => {
    program.option(optionFlags(option), option.description, option.default);
  });

  program.action(metadata.action);
};

export default registerCommand;
