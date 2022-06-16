import { Command } from "commander";

export type EvarDocCommandOption = {
  shortName: string;
  fullName: string;
  description: string;
  default: string | boolean | string[];
  required: boolean;
};

export type EvarDocCommandMetadata<Options = null> = {
  command: string;
  description: string;
  argument: EvarDocCommandArgument;
  options?: EvarDocCommandOption[];
  action: EvarDocCommandAction<Options>;
};

export type EvarDocCommand = (program: Command) => void;
export type EvarDocCommandAction<Options = null> = (
  argument: string,
  options: Options
) => Promise<void>;

export type EvarDocCommandArgument = {
  name: string;
  description: string;
  required: boolean;
};
