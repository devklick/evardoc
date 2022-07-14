import commands from "./commands";
import { Command } from "commander";

type EvarDocCliMetadata = {
  name: string;
  description: string;
};

export const cliMetadata: EvarDocCliMetadata = {
  name: "EvarDoc",
  description: "Documentation of environment variables made easy",
};

const cli = (program: Command, version: string): void => {
  program
    .name(cliMetadata.name)
    .description(cliMetadata.description)
    .version(version);

  commands.format.register(program);
  commands.template.register(program);

  program.parse();
};

export default cli;
