import {
  action,
  Options,
  templateCommandMetadata,
  register,
} from "../../../../src/lib/cli/commands/template";

import {
  parse as actualParse,
  tryParse as actualTryParse,
  ParseResult,
} from "../../../../src/lib/core/env-parser";
import { logParseResult as actualLogParseResult } from "../../../../src/lib/core/logger";
import { formatTemplate as actualFormatTemplate } from "../../../../src/lib/core/env-formatter";
import { write as actualWrite } from "../../../../src/lib/core/env-writer";
import actualRegisterCommand from "../../../../src/lib/cli/commands/register-command";
import { program } from "commander";
import { parsedEvar1, parsedEvar2 } from "../../../test-data";

jest.mock("commander");
jest.mock("../../../../src/lib/core/env-parser.ts");
jest.mock("../../../../src/lib/core/logger.ts");
jest.mock("../../../../src/lib/core/env-formatter.ts");
jest.mock("../../../../src/lib/core/env-writer.ts");
jest.mock("../../../../src/lib/cli/commands/register-command");

const mockParse = jest.mocked(actualParse, true);
const mockTryParse = jest.mocked(actualTryParse, true);
const mockLogParseResult = jest.mocked(actualLogParseResult, true);
const mockFormatTemplate = jest.mocked(actualFormatTemplate, true);
const mockWrite = jest.mocked(actualWrite, true);
const mockProcessExit = jest.spyOn(process, "exit").mockImplementation();
const mockRegisterCommand = jest.mocked(actualRegisterCommand, true);
const mockProgram = jest.mocked(program, true);

describe("template command", () => {
  describe("action", () => {
    let envFile: string;
    let options: Options;
    let parseResult1: ParseResult;
    let parseResult2: ParseResult;
    let formattedContent: string;

    beforeEach(() => {
      envFile = ".env";
      options = { verbose: true, destination: "dest", overwrite: false };
      parseResult1 = {
        success: true,
        variables: [parsedEvar1],
      };
      parseResult2 = {
        ...parseResult1,
        variables: [parsedEvar2],
      };
      formattedContent = "dummy data";
      mockParse.mockResolvedValue(parseResult1);
      mockTryParse.mockResolvedValue(parseResult2);
      mockFormatTemplate.mockReturnValue(formattedContent);
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
        options.verbose = verbose;
        await action(envFile, options);
        expect(mockLogParseResult).toBeCalledTimes(2);
        expect(mockLogParseResult).toBeCalledWith(
          envFile,
          parseResult1,
          verbose
        );
      }
    );
    it("Should exit the program when parsing was unsuccessful", async () => {
      parseResult1.success = false;
      await action(envFile, options);
      expect(mockProcessExit).toBeCalledTimes(1);
      expect(mockProcessExit).toBeCalledWith(1);
    });

    it.each([true, false])(
      "Should try and parse the destination file depending on overwrite property",
      async (overwrite: boolean) => {
        options.overwrite = overwrite;
        await action(envFile, options);
        expect(mockTryParse).toBeCalledTimes(overwrite ? 0 : 1);
      }
    );

    it("Should log the parsed destination file, if there was one", async () => {
      await action(envFile, options);
      expect(mockLogParseResult).toBeCalledTimes(2);
      expect(mockLogParseResult).toBeCalledWith(
        options.destination,
        parseResult2,
        options.verbose
      );
    });
    it("Should not log the parsed destination file, when none was found", async () => {
      mockTryParse.mockResolvedValue(null);
      await action(envFile, options);
      expect(mockLogParseResult).toBeCalledTimes(1);
      expect(mockLogParseResult).not.toBeCalledWith(
        options.destination,
        parseResult2,
        options.verbose
      );
    });

    it("Should exit the program when parsing the destination file was unsuccessful", async () => {
      parseResult2.success = false;
      await action(envFile, options);
      expect(mockProcessExit).toBeCalledTimes(1);
      expect(mockProcessExit).toBeCalledWith(1);
    });
    it("Should format the parse results", async () => {
      await action(envFile, options);
      expect(mockFormatTemplate).toBeCalledWith(
        parseResult1.variables,
        parseResult2.variables
      );
    });

    it("Should write the formatted data to the environment file", async () => {
      await action(envFile, options);
      expect(mockWrite).toBeCalledTimes(1);
      expect(mockWrite).toBeCalledWith(formattedContent, options.destination);
    });
  });
  describe("templateCommandMetadata", () => {
    it('Should be called "template"', () => {
      expect(templateCommandMetadata.command).toStrictEqual("template");
    });
    it("Should have a sensible description", () => {
      expect(templateCommandMetadata.description).toStrictEqual(
        "Create a new environment file template from an existing environment file. " +
          "Takes the EvarDoc comments and environment variable names (not values) from the environment file, formats them, and writes them to a template file."
      );
    });

    describe("argument", () => {
      it('Should be called "src"', () => {
        expect(templateCommandMetadata.argument.name).toStrictEqual("src");
      });
      it("Should have a sensible description", () => {
        expect(templateCommandMetadata.argument.description).toStrictEqual(
          "The path to the environment to be used as the source of data for the template"
        );
      });
      it("Should be optional", () => {
        expect(templateCommandMetadata.argument.required).toStrictEqual(false);
      });
      it("Should have a default value", () => {
        expect(templateCommandMetadata.argument.default).toStrictEqual(".env");
      });
    });
    describe("options", () => {
      it("Should support 3 options option", () => {
        expect(templateCommandMetadata.options).toHaveLength(3);
      });
      describe("option 0", () => {
        it('Should be called "overwrite"', () => {
          expect(templateCommandMetadata.options![0].fullName).toStrictEqual(
            "overwrite"
          );
        });
        it('Should have a shortname "o"', () => {
          expect(templateCommandMetadata.options![0].shortName).toStrictEqual(
            "o"
          );
        });
        it("Should have a sensible description", () => {
          expect(templateCommandMetadata.options![0].description).toStrictEqual(
            "Whether or not the existing template (if one exists), should be overwritten with the template content based on the environment file. " +
              "Without this option, only new environment variable information will be written to the bottom of the template, if one already exists"
          );
        });
        it("should be optional", () => {
          expect(templateCommandMetadata.options![0].required).toStrictEqual(
            false
          );
        });
        it("should default to false", () => {
          expect(templateCommandMetadata.options![0].default).toStrictEqual(
            false
          );
        });
        it("should be a boolean flag", () => {
          expect(templateCommandMetadata.options![0].boolean).toStrictEqual(
            true
          );
        });
      });
      describe("option 1", () => {
        it('Should be called "destination"', () => {
          expect(templateCommandMetadata.options![1].fullName).toStrictEqual(
            "destination"
          );
        });
        it('Should have a shortname "d"', () => {
          expect(templateCommandMetadata.options![1].shortName).toStrictEqual(
            "d"
          );
        });
        it("Should have a sensible description", () => {
          expect(templateCommandMetadata.options![1].description).toStrictEqual(
            "The file that he template should be saved to"
          );
        });
        it("should be optional", () => {
          expect(templateCommandMetadata.options![1].required).toStrictEqual(
            false
          );
        });
        it('should default to "template.env"', () => {
          expect(templateCommandMetadata.options![1].default).toStrictEqual(
            "template.env"
          );
        });
        it("should not be a boolean flag", () => {
          expect(templateCommandMetadata.options![1].boolean).toStrictEqual(
            false
          );
        });
      });
      describe("option 2", () => {
        it('Should be called "verbose', () => {
          expect(templateCommandMetadata.options![2].fullName).toStrictEqual(
            "verbose"
          );
        });
        it('Should have a shortname "v"', () => {
          expect(templateCommandMetadata.options![2].shortName).toStrictEqual(
            "v"
          );
        });
        it("Should have a sensible description", () => {
          expect(templateCommandMetadata.options![2].description).toStrictEqual(
            "Whether or not verbose logs should be written out"
          );
        });
        it("should be optional", () => {
          expect(templateCommandMetadata.options![2].required).toStrictEqual(
            false
          );
        });
        it("should default to false", () => {
          expect(templateCommandMetadata.options![2].default).toStrictEqual(
            false
          );
        });
        it("should be a boolean flag", () => {
          expect(templateCommandMetadata.options![2].boolean).toStrictEqual(
            true
          );
        });
      });
    });
  });

  describe("register", () => {
    it("Should call the registerCommand function to register the template command", () => {
      register(mockProgram);
      expect(mockRegisterCommand).toBeCalledTimes(1);
      expect(mockRegisterCommand).toBeCalledWith(
        mockProgram,
        templateCommandMetadata
      );
    });
  });
});
