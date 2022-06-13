import { program } from "commander";
import { parse } from "./core/env-parser";

type Command = {
  command: string;
  description: string;
};

const Refactor: Command = {
  command: "refactor",
  description:
    "Parses the specified environment file, formats it, and overwrites the file with the new formatted content",
};
const CreateTemplate: Command = {
  command: "template",
  description:
    "Parses the specified environment file, extracting the environment variable keys (not values) and the EvarDoc comments and writing them to a new file.",
};

program
  .name("EvarDoc")
  .description("Documentation of environment variables made easy")
  .version("0.0.0");

program
  .command(Refactor.command)
  .description(Refactor.description)
  .argument("<string>", "The path to the environment file")
  .action(async (envFilePath: string) => {
    const parsed = await parse(envFilePath);
    // use env-formatter module to format the parsed environment file data
    // use env-writer module to re-write the same env file with the formatted data
    console.log(parsed);
  });

program
  .command(CreateTemplate.command)
  .description(CreateTemplate.description)
  .argument("<string>", "The path to the environment file")
  .action(async (envFilePath: string) => {
    const parsed = await parse(envFilePath);
    // use env-formatter module to format the parsed environment file data
    // use env-writer module to write the environment file data (excluding variable values) to a template.env file
    console.log(parsed);
  });

program.parse();
