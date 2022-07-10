import {
  isComment,
  isNullOrWhiteSpace,
  parse,
  ParseResult,
  tryParse,
} from "../../../src/lib/core/env-parser";
import * as fs from "fs/promises";
import * as envParser from "../../../src/lib/core/env-parser";

jest.mock("fs/promises");

const mockFs = jest.mocked(fs, true);

describe("envParser", () => {
  describe("isComment", () => {
    it("Should return true when the line starts with a hash", () => {
      expect(isComment("#")).toBe(true);
    });
    it("Should return true when the line starts with whitespace followed by a hash", () => {
      expect(isComment("   #    ")).toBe(true);
    });
    it("Should return false when the line does not start with a hash ", () => {
      expect(isComment(".#")).toBe(false);
    });
  });

  describe("isNullOrWhiteSpace", () => {
    it.each([null, undefined, ""])(
      "Should return true when the string is falsey ($value)",
      (value) => {
        expect(isNullOrWhiteSpace(value)).toBe(true);
      }
    );
    it.each(["    ", "\t", "\xa0"])(
      "Should return true when the string contains only white space ($value)",
      (value) => {
        expect(isNullOrWhiteSpace(value)).toBe(true);
      }
    );

    it("Should return false when the string contains no-white space characters", () => {
      expect(isNullOrWhiteSpace(".")).toBe(false);
    });
  });

  describe("tryeParse", () => {
    const processParsedContentSpy = jest
      .spyOn(envParser, "processParsedContent")
      .mockImplementation();

    const tryReadFileSpy = jest
      .spyOn(envParser, "tryReadFile")
      .mockImplementation();

    const envFilePath = ".env";
    const mockFileContent = "Some content";
    const mockParsedContent: ParseResult = {
      success: true,
      variables: [
        {
          name: "TEST_EVAR",
          value: "TEST_VALUE",
          type: "string",
          requirement: "required",
          default: "empty",
          description: ["some info about the var"],
          example: "my string",
          errors: [],
        },
      ],
    };
    beforeEach(() => {
      tryReadFileSpy.mockResolvedValue(mockFileContent);
      processParsedContentSpy.mockReturnValue(mockParsedContent);
    });
    afterEach(() => {
      jest.clearAllMocks();
    });
    it("Should process the file content when the file was successfully read", async () => {
      const result = await tryParse(envFilePath);
      expect(result).toBe(mockParsedContent);
      expect(tryReadFileSpy).toBeCalledTimes(1);
      expect(processParsedContentSpy).toBeCalledTimes(1);
      expect(processParsedContentSpy).toBeCalledWith(mockFileContent);
    });
    it("Should return without processing when the file could not be read", async () => {
      tryReadFileSpy.mockResolvedValue(null);
      const result = await tryParse(envFilePath);
      expect(result).toBeNull();
      expect(tryReadFileSpy).toBeCalledTimes(1);
      expect(processParsedContentSpy).toBeCalledTimes(0);
    });
  });

  describe("parse", () => {
    const mockParsedContent: ParseResult = {
      success: true,
      variables: [
        {
          name: "TEST_EVAR",
          value: "TEST_VALUE",
          type: "string",
          requirement: "required",
          default: "empty",
          description: ["some info about the var"],
          example: "my string",
          errors: [],
        },
      ],
    };
    const processParsedContentSpy = jest
      .spyOn(envParser, "processParsedContent")
      .mockImplementation();

    const envFilePath = ".env";
    const mockFileContent = "file content";

    beforeEach(() => {
      mockFs.readFile.mockResolvedValue(mockFileContent);
      processParsedContentSpy.mockReturnValue(mockParsedContent);
    });
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("Should read the file contents", async () => {
      await parse(envFilePath);
      expect(mockFs.readFile).toBeCalledTimes(1);
      expect(mockFs.readFile).toBeCalledWith(envFilePath, "utf-8");
    });
    it("Should parse the file contents", async () => {
      const result = await parse(envFilePath);
      expect(result).toBe(mockParsedContent);
      expect(processParsedContentSpy).toBeCalledTimes(1);
      expect(processParsedContentSpy).toBeCalledWith(mockFileContent);
    });
  });
});
