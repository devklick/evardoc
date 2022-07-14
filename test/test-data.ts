import { ParsedEvar } from "src/lib/core/env-parser";

export const parsedEvar1: Readonly<ParsedEvar> = {
  default: true,
  description: ["test var"],
  errors: [],
  example: false,
  name: "test",
  requirement: "optional",
  type: "boolean",
  value: "false",
};

export const parsedEvar2: Readonly<ParsedEvar> = {
  default: 0,
  description: ["test var"],
  errors: [],
  example: 3,
  name: "test 2",
  requirement: "required",
  type: "integer",
  value: "1",
};
export const parsedEvar3_WithWarnings: Readonly<ParsedEvar> = {
  default: 1.23,
  description: ["test var 3"],
  errors: [
    {
      code: "bad-evardoc-value",
      message: "some warning",
      severity: "warning",
    },
  ],
  example: 3.45,
  name: "test 2",
  requirement: "optional",
  type: "decimal",
  value: "2.34",
};

export const parsedEvar4_WithFatalError: Readonly<ParsedEvar> = {
  default: 1.23,
  description: ["test var 3"],
  errors: [
    {
      code: "malformed-environment-variable",
      message: "some error",
      severity: "fatal",
    },
  ],
  example: 3.45,
  name: "test 2",
  requirement: "optional",
  type: "decimal",
  value: "2.34",
};

export const parsedEvar5_WithWarningsAndError: Readonly<ParsedEvar> = {
  default: 9.87,
  description: ["test var 5"],
  errors: [
    {
      code: "empty-line",
      message: "some other warning",
      severity: "warning",
    },
    {
      code: "bad-evardoc-value",
      message: "some fatal error",
      severity: "fatal",
    },
  ],
  example: 6.66,
  name: "test 5",
  requirement: "optional",
  type: "decimal",
  value: "4.56",
};
