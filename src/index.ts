import { program } from "commander";
import { format, formatTemplate } from "./lib/core/env-formatter";
import { parse } from "./lib/core/env-parser";
import { write } from "./lib/core/env-writer";

const packageVersion = require("../package.json").version;

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
  .version(packageVersion);

program
  .command(Refactor.command)
  .description(Refactor.description)
  .argument("<string>", "The path to the environment file")
  .action(async (envFilePath: string) => {
    const parsed = await parse(envFilePath);
    if (!parsed.success)
      throw new Error("Parsing failed. Worry about this later");
    const formatted = format(parsed.variables);
    await write(formatted, envFilePath);
  });

program
  .command(CreateTemplate.command)
  .description(CreateTemplate.description)
  .argument("<string>", "The path to the environment file")
  .option(
    "-o, --overwrite",
    "Whether or not the new template should overwrite the existing one, if one exists. Defaults to false, meaning any new environment variables will be appended to the existing template, if one exists",
    false
  )
  .action(async (envFilePath, { overwrite }: { overwrite: boolean }) => {
    const parsed = await parse(envFilePath);
    const existing = overwrite ? null : await parse("template.env");
    if (!parsed.success)
      throw new Error("Parsing failed. Worry about this later");
    const formatted = formatTemplate(parsed.variables, existing?.variables);
    await write(formatted, "template.env");
  });

program.parse();
