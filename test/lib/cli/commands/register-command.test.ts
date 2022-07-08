import {
  EvarDocCommandArgument,
  EvarDocCommandMetadata,
  EvarDocCommandOption,
} from "../../../../src/lib/cli/commands/types";
import registerCommand, {
  addRequirementParens,
  argName,
  optionFlags,
} from "../../../../src/lib/cli/commands/register-command";

import { program } from "commander";

jest.mock("commander");

const mockProgram = jest.mocked(program, true);

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

describe("register-command", () => {
  const mockMetaData: EvarDocCommandMetadata = {
    action: jest.fn(),
    argument: {
      description: "test-description",
      name: "test-name",
      required: true,
      default: false,
    },
    command: "test-command",
    description: "test-description",
    options: [
      {
        boolean: false,
        default: true,
        description: "test-description",
        fullName: "test-fullName",
        required: false,
        shortName: "test-shortname",
      },
    ],
  };
  beforeEach(() => {
    mockProgram.action.mockReturnValue(mockProgram);
    mockProgram.argument.mockReturnValue(mockProgram);
    mockProgram.command.mockReturnValue(mockProgram);
    mockProgram.description = jest.fn().mockReturnValue(mockProgram);
    mockProgram.option.mockReturnValue(mockProgram);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("Should add the metadata to the program", () => {
    registerCommand(mockProgram, mockMetaData);
  });
  describe("addRequirementParens", () => {
    it("Should wrap the value in angle brackets when its required", () => {
      const value = "value";
      const expected = `<${value}>`;
      const result = addRequirementParens(value, true);
      expect(result).toStrictEqual(expected);
    });
    it("Should wrap the value in square brackets when its not required", () => {
      const value = "value";
      const expected = `[${value}]`;
      const result = addRequirementParens(value, false);
      expect(result).toStrictEqual(expected);
    });
  });
  describe("argName", () => {
    let arg: EvarDocCommandArgument;
    beforeEach(() => {
      arg = {
        name: "value",
        required: true,
        description: "",
      };
    });
    it("Should wrap the name in angle brackets when its required", () => {
      const expected = `<${arg.name}>`;
      const result = argName(arg);
      expect(result).toStrictEqual(expected);
    });
    it("Should wrap the name in square brackets when its not required", () => {
      arg.required = false;
      const expected = `[${arg.name}]`;
      const result = argName(arg);
      expect(result).toStrictEqual(expected);
    });
  });

  describe("optionFlags", () => {
    let options: EvarDocCommandOption;
    beforeEach(() => {
      options = {
        shortName: "short",
        fullName: "full",
        boolean: true,
        required: false,
        description: "",
        default: "",
      };
    });
    it("Should contain the shortname and full name, separated by comma and preceded with hyphens", () => {
      const expectedShort = `-${options.shortName}`;
      const expectedFull = `--${options.fullName}`;
      const result = optionFlags(options);
      expect(result).toStrictEqual(`${expectedShort}, ${expectedFull}`);
    });

    it("Should include the shortname at the end, surrounded by square brackets, when optional non-boolean", () => {
      options.boolean = false;
      options.required = false;
      const expected = `[${options.shortName}]`;
      const result = optionFlags(options);
      expect(result).toMatch(new RegExp(escapeRegExp(expected) + "$"));
    });

    it("Should include the shortname at the end, surrounded by angle brackets, when required non-boolean", () => {
      options.boolean = false;
      options.required = true;
      const expected = `<${options.shortName}>`;
      const result = optionFlags(options);
      expect(result).toMatch(new RegExp(escapeRegExp(expected) + "$"));
    });
  });
});
