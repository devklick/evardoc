import { program } from "commander";
import { commands } from "./lib/commands";

program
  .name("EvarDoc")
  .description("Documentation of environment variables made easy")
  .version("0.0.0");

commands.refactor(program);
commands.template(program);

program.parse();
