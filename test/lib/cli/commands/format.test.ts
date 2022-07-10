import {
  action,
  formatCommandMetadata,
  Options,
  register,
} from "../../../../src/lib/cli/commands/format";

import {
  parse as actualParse,
  ParseResult,
} from "../../../../src/lib/core/env-parser";
import { logParseResult as actualLogParseResult } from "../../../../src/lib/core/logger";
import { applyFormat as actualApplyFormat } from "../../../../src/lib/core/env-formatter";
import { write as actualWrite } from "../../../../src/lib/core/env-writer";
import actualRegisterCommand from "../../../../src/lib/cli/commands/register-command";
import { program } from "commander";
import { parsedEvar1 } from "test/test-data";

jest.mock("commander");
jest.mock("../../../../src/lib/core/env-parser.ts");
jest.mock("../../../../src/lib/core/logger.ts");
jest.mock("../../../../src/lib/core/env-formatter.ts");
jest.mock("../../../../src/lib/core/env-writer.ts");
jest.mock("../../../../src/lib/cli/commands/register-command");

const mockParse = jest.mocked(actualParse, true);
const mockLogParseResult = jest.mocked(actualLogParseResult, true);
const mockApplyFormat = jest.mocked(actualApplyFormat, true);
const mockWrite = jest.mocked(actualWrite, true);
const mockProcessExit = jest.spyOn(process, "exit").mockImplementation();
const mockRegisterCommand = jest.mocked(actualRegisterCommand, true);
const mockProgram = jest.mocked(program, true);

describe("format command", () => {
  describe("action", () => {
    let envFile: string;
    let options: Options;
    let parseResult: ParseResult;
    let formattedContent: string;

    beforeEach(() => {
      envFile = ".env";
      options = { verbose: true };
      parseResult = {
        success: true,
        variables: [parsedEvar1],
      };
      formattedContent = "dummy data";
      mockParse.mockResolvedValue(parseResult);
      mockApplyFormat.mockReturnValue(formattedContent);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("Should parse the specified envFilePath", async () => {
      await action(envFile, options);
      expect(mockParse).toBeCalledTimes(1);
      expect(mockParse).toBeCalledWith(envFile);
    });

    it.each([true, false])(
      "Should log the parse result, verbose %v",
      async (verbose) => {
        options = { verbose };
        await action(envFile, options);
        expect(mockLogParseResult).toBeCalledTimes(1);
        expect(mockLogParseResult).toBeCalledWith(
          envFile,
          parseResult,
          verbose
        );
      }
    );
    it("Should exit the program when parsing was unsuccessful", async () => {
      parseResult.success = false;
      await action(envFile, options);
      expect(mockProcessExit).toBeCalledTimes(1);
      expect(mockProcessExit).toBeCalledWith(1);
    });

    it("Should format the parse results", async () => {
      await action(envFile, options);
      expect(mockApplyFormat).toBeCalledTimes(1);
      expect(mockApplyFormat).toBeCalledWith(parseResult.variables);
    });

    it("Should write the formatted data to the environment file", async () => {
      await action(envFile, options);
      expect(mockWrite).toBeCalledTimes(1);
      expect(mockWrite).toBeCalledWith(formattedContent, envFile);
    });
  });

  describe("formatCommandMetadata", () => {
    it('Should be called "format"', () => {
      expect(formatCommandMetadata.command).toStrictEqual("format");
    });
    it("Should have a sensible description", () => {
      expect(formatCommandMetadata.description).toStrictEqual(
        "Format an environment file, applying opinionated formatting"
      );
    });

    describe("argument", () => {
      it('Should be called "src"', () => {
        expect(formatCommandMetadata.argument.name).toStrictEqual("src");
      });
      it("Should have a sensible description", () => {
        expect(formatCommandMetadata.argument.description).toStrictEqual(
          "The path to the environment file to be formatted"
        );
      });
      it("Should be optional", () => {
        expect(formatCommandMetadata.argument.required).toStrictEqual(false);
      });
      it("Should have a default value", () => {
        expect(formatCommandMetadata.argument.default).toStrictEqual(".env");
      });
    });
    describe("options", () => {
      it("Should support a single option", () => {
        expect(formatCommandMetadata.options).toHaveLength(1);
      });
      describe("option 0", () => {
        it('Should be called "verbose', () => {
          expect(formatCommandMetadata.options![0].fullName).toStrictEqual(
            "verbose"
          );
        });
        it('Should have a shortname "v"', () => {
          expect(formatCommandMetadata.options![0].shortName).toStrictEqual(
            "v"
          );
        });
        it("Should have a sensible description", () => {
          expect(formatCommandMetadata.options![0].description).toStrictEqual(
            "Whether or not verbose logs should be written out"
          );
        });
        it("should be optional", () => {
          expect(formatCommandMetadata.options![0].required).toStrictEqual(
            false
          );
        });
        it("should default to false", () => {
          expect(formatCommandMetadata.options![0].default).toStrictEqual(
            false
          );
        });
        it("should be a boolean flag", () => {
          expect(formatCommandMetadata.options![0].boolean).toStrictEqual(true);
        });
      });
    });
  });

  describe("register", () => {
    it("Should call the registerCommand function to register the format command", () => {
      register(mockProgram);
      expect(mockRegisterCommand).toBeCalledTimes(1);
      expect(mockRegisterCommand).toBeCalledWith(
        mockProgram,
        formatCommandMetadata
      );
    });
  });
});
