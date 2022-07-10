import {
  isComment,
  isNullOrWhiteSpace,
  parse,
  ParseResult,
  processParsedContent,
  RawEvar,
  tryParse,
} from "../../../src/lib/core/env-parser";
import * as fs from "fs/promises";
import * as envParser from "../../../src/lib/core/env-parser";
import {
  parsedEvar1,
  parsedEvar2,
  parsedEvar3_WithWarnings,
  parsedEvar4_WithFatalError,
} from "../../test-data";

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
    let processParsedContentSpy: jest.SpyInstance;
    let tryReadFileSpy: jest.SpyInstance;

    const envFilePath = ".env";
    const mockFileContent = "Some content";
    const mockParsedContent: ParseResult = {
      success: true,
      variables: [parsedEvar1, parsedEvar2],
    };
    beforeEach(() => {
      processParsedContentSpy = jest
        .spyOn(envParser, "processParsedContent")
        .mockImplementation();
      tryReadFileSpy = jest
        .spyOn(envParser, "tryReadFile")
        .mockImplementation();

      tryReadFileSpy.mockResolvedValue(mockFileContent);
      processParsedContentSpy.mockReturnValue(mockParsedContent);
    });
    afterEach(() => {
      jest.clearAllMocks();
    });
    afterAll(() => {
      processParsedContentSpy.mockRestore();
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
      variables: [parsedEvar1, parsedEvar2],
    };
    let processParsedContentSpy: jest.SpyInstance;

    const envFilePath = ".env";
    const mockFileContent = "file content";

    beforeEach(() => {
      processParsedContentSpy = jest
        .spyOn(envParser, "processParsedContent")
        .mockImplementation();

      mockFs.readFile.mockResolvedValue(mockFileContent);
      processParsedContentSpy.mockReturnValue(mockParsedContent);
    });
    afterEach(() => {
      jest.clearAllMocks();
    });
    afterAll(() => {
      processParsedContentSpy.mockRestore();
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
  describe("processParsedContent", () => {
    let getRawEvarsSpy: jest.SpyInstance;
    let parseRawEvarSpy: jest.SpyInstance;

    const content = "some mock content";
    let rawEvars: Array<RawEvar>;

    beforeEach(() => {
      getRawEvarsSpy = jest
        .spyOn(envParser, "getRawEvars")
        .mockImplementation();

      parseRawEvarSpy = jest
        .spyOn(envParser, "parseRawEvar")
        .mockImplementation();

      rawEvars = [
        {
          definition: "EXAMPLE=VARIABLE",
          comments: [
            "Some stuff: about variable",
            "More stuff: about same variable",
          ],
        },
        {
          definition: "ANOTHER=VAR",
          comments: ["Some comment: with info", "More info: about var"],
        },
      ];
      getRawEvarsSpy.mockReturnValue(rawEvars);
      parseRawEvarSpy
        .mockReturnValueOnce(parsedEvar1)
        .mockReturnValueOnce(parsedEvar2);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("Should extract the raw environment variables from the content parameter", () => {
      processParsedContent(content);
      expect(getRawEvarsSpy).toBeCalledTimes(1);
      expect(getRawEvarsSpy).toBeCalledWith(content);
    });

    it("Should parse ach of the raw environment variables", () => {
      processParsedContent(content);
      expect(parseRawEvarSpy).toBeCalledTimes(rawEvars.length);
      rawEvars.forEach((raw) => expect(parseRawEvarSpy).toBeCalledWith(raw));
    });

    it("Should treat warnings as successful", () => {
      parseRawEvarSpy.mockReset();
      parseRawEvarSpy
        .mockReturnValueOnce(parsedEvar3_WithWarnings)
        .mockReturnValueOnce(parsedEvar1);
      const result = processParsedContent(content);
      expect(result.success).toBe(true);
      expect(result.variables).toStrictEqual([
        parsedEvar3_WithWarnings,
        parsedEvar1,
      ]);
    });

    it("Should treat fatal errors as unsuccessful", () => {
      parseRawEvarSpy.mockReset();
      parseRawEvarSpy
        .mockReturnValueOnce(parsedEvar4_WithFatalError)
        .mockReturnValueOnce(parsedEvar1);
      const result = processParsedContent(content);
      expect(result.success).toBe(false);
      expect(result.variables).toStrictEqual([
        parsedEvar4_WithFatalError,
        parsedEvar1,
      ]);
    });
  });
});
