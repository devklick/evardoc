import * as commands from "./commands";
import { Command } from "commander";

import { EvarDocCommandMetadata } from "./commands/types";

type EvarDocCliMetadata = {
  name: string;
  description: string;
  version: string;
};

const cliMetadata: EvarDocCliMetadata = {
  name: "EvarDoc",
  description: "Documentation of environment variables made easy",
  version: "",
};

const cli = (program: Command, version: string): void => {
  program
    .name(cliMetadata.name)
    .description(cliMetadata.description)
    .version(version);

  commands.refactor(program);
  commands.template(program);

  program.parse();
};

export default cli;
