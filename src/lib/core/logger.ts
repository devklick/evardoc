import { EOL } from "os";
import { ParsedEvar, ParseResult } from "./env-parser";
import { EvarDocKeys } from "./types";
const tab = "    ";

export const logParseResult = (
  envFilePath: string,
  parseResult: ParseResult,
  verbose: boolean
) => {
  if (parseResult.success) {
    logParseSuccess(envFilePath, parseResult.variables, verbose);
  } else {
    logParseFailure(envFilePath, parseResult.variables, verbose);
  }
};

export const logParseSuccess = (
  envFilePath: string,
  variables: ParsedEvar[],
  verbose: boolean
) => {
  if (!verbose) return;
  const lines: string[] = [`Successfully parsed ${envFilePath}`];
  const maybeAddLine = (indents: number, key: string, value: unknown) => {
    if (value) {
      const indentsString = tab.repeat(indents);
      const valueString = Array.isArray(value) ? value.join(EOL) : value;
      lines.push(`${indentsString}${key}: ${valueString}`);
    }
  };
  variables.forEach((variable) => {
    maybeAddLine(1, "variable", variable.name);
    maybeAddLine(2, EvarDocKeys.description, variable.description);
    maybeAddLine(2, EvarDocKeys.type, variable.type);
    maybeAddLine(2, EvarDocKeys.requirement, variable.requirement);
    maybeAddLine(2, EvarDocKeys.default, variable.default);
    maybeAddLine(2, EvarDocKeys.example, variable.example);
  });
  console.info(lines.join(EOL));

  logParseWarnings(envFilePath, variables, verbose);
};

export const logParseWarnings = (
  envFilePath: string,
  variables: ParsedEvar[],
  verbose: boolean
) => {
  const varsWithWarnings = variables.filter((v) =>
    v.errors.some((e) => e.severity === "warning")
  );
  if (!verbose || !varsWithWarnings.length) return;

  const lines: string[] = [`Encountered warnings while parsing ${envFilePath}`];
  const addWarning = (indents: number, code: string, message: string) => {
    const indentsString = tab.repeat(indents);
    lines.push(`${indentsString}${message} (${code})`);
  };
  varsWithWarnings.forEach((variable) => {
    lines.push(`${tab}variable: ${variable.name}`);
    variable.errors.forEach((error) => {
      if (error.severity === "warning") {
        addWarning(2, error.code, error.message);
      }
    });
  });
  console.warn(lines.join(EOL));
};

export const logParseFailure = (
  envFilePath: string,
  variables: ParsedEvar[],
  verbose: boolean // TODO: May be used for extra logging in future
) => {
  logParseWarnings(envFilePath, variables, verbose);

  const varsWithErrors = variables.filter((v) =>
    v.errors.some((e) => e.severity === "fatal")
  );
  if (!varsWithErrors.length) return;

  const lines: string[] = [`Failed to parse ${envFilePath}`];

  const addWarning = (indents: number, code: string, message: string) => {
    const indentsString = tab.repeat(indents);
    lines.push(`${indentsString}${message} (${code})`);
  };
  varsWithErrors.forEach((variable) => {
    lines.push(`${tab}variable: ${variable.name}`);
    variable.errors.forEach((error) => {
      if (error.severity === "fatal") {
        addWarning(2, error.code, error.message);
      }
    });
  });
  console.error(lines.join(EOL));
};
