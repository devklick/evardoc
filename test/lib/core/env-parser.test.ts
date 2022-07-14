import {
  appendToDescription,
  errorType,
  findComment,
  findDescription,
  findRequirementComment,
  findTypeComment,
  getRawEvars,
  isComment,
  isNullOrWhiteSpace,
  parse,
  parseComment,
  parseComments,
  parseDefinition,
  ParsedEvarComment,
  ParsedEvarDefinition,
  ParseError,
  parseRawEvar,
  ParseResult,
  processParsedContent,
  RawEvar,
  tryParse,
  tryReadFile,
} from "../../../src/lib/core/env-parser";
import * as fs from "fs/promises";
import * as envParser from "../../../src/lib/core/env-parser";
import {
  parsedEvar1,
  parsedEvar2,
  parsedEvar3_WithWarnings,
  parsedEvar4_WithFatalError,
} from "../../test-data";
import {
  EvarDocKey,
  EvarDocKeys,
  EvarRequirement,
  EvarRequirements,
  EvarType,
  EvarTypes,
} from "../../../src/lib/core/types";

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
      "Should return true when the string is falsy ($value)",
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

  describe("tryParse", () => {
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
      tryReadFileSpy.mockRestore();
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

    afterAll(() => {
      getRawEvarsSpy.mockRestore();
      parseRawEvarSpy.mockRestore();
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

  describe("tryReadFile", () => {
    const path = ".env";
    const fileContent = "mock content";
    beforeEach(() => {
      mockFs.readFile.mockResolvedValue(fileContent);
    });
    afterEach(() => {
      jest.clearAllMocks();
    });
    it("Should return the file contents when able to successfully read the file", async () => {
      const result = await tryReadFile(path);
      expect(result).toBe(fileContent);
      expect(mockFs.readFile).toBeCalledTimes(1);
      expect(mockFs.readFile).toBeCalledWith(path, "utf-8");
    });
    it("Should return null when an error occurs while trying to read the file", async () => {
      mockFs.readFile.mockRejectedValue(new Error());
      const result = await tryReadFile(path);
      expect(result).toBeNull();
    });
  });

  describe("getRawEvars", () => {
    it("Should ignore empty lines", () => {
      const content = "VAR_1=VALUE_1\n         \nVAR_2=VALUE_2";
      const result = getRawEvars(content);
      expect(result).toHaveLength(2);
    });
    it("Should add all comment lines to the comments array", () => {
      const comment1 = "#comment 1";
      const comment2 = "  ##      comment 2";
      const content = `${comment1}\n${comment2}\nVAR_1=VALUE_1`;
      const result = getRawEvars(content);
      expect(result).toHaveLength(1);
      expect(result[0].comments).toHaveLength(2);
      expect(result[0].comments[0]).toBe(comment1);
      expect(result[0].comments[1]).toBe(comment2);
    });

    it("Should add non-empty, non-comment lines as a new  variable definition", () => {
      const var1 = "VAR_1=VALUE_1";
      const var2 = "VAR_2=VALUE_2";
      const var3 = "VAR_3=VALUE_3";
      const content = `${var1}\n${var2}\n${var3}`;
      const result = getRawEvars(content);
      expect(result).toHaveLength(3);
      expect(result[0].definition).toBe(var1);
      expect(result[1].definition).toBe(var2);
      expect(result[2].definition).toBe(var3);
    });
  });

  describe("parseRawEvar", () => {
    let parseDefinitionSpy: jest.SpyInstance;
    let parseCommentsSpy: jest.SpyInstance;

    const mockRawEvar: RawEvar = {
      comments: ["some", "comments"],
      definition: "MY_VAR=VAR_VALUE",
    };

    const mockParsedDefinition: ParsedEvarDefinition = {
      key: "MY_VAR",
      value: "MY_VALUE",
      errors: [],
    };

    const createParsedEvarComment = (
      key: EvarDocKey,
      value: EvarType | EvarRequirement | string
    ): ParsedEvarComment => ({
      key,
      value,
      errors: [],
    });

    const descriptionComment = createParsedEvarComment(
      "description",
      "some variable description"
    );
    const requirementComment = createParsedEvarComment(
      "requirement",
      EvarRequirements.required
    );
    const typeComment = createParsedEvarComment("type", EvarTypes.string);
    const exampleComment = createParsedEvarComment("example", "example value");
    const defaultComment = createParsedEvarComment("default", "default value");

    const mockParsedComments: ParsedEvarComment[] = [
      descriptionComment,
      requirementComment,
      typeComment,
      exampleComment,
      defaultComment,
    ];

    beforeEach(() => {
      parseDefinitionSpy = jest
        .spyOn(envParser, "parseDefinition")
        .mockImplementation()
        .mockReturnValue(mockParsedDefinition);

      parseCommentsSpy = jest
        .spyOn(envParser, "parseComments")
        .mockImplementation()
        .mockReturnValue(mockParsedComments);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    afterAll(() => {
      parseDefinitionSpy.mockRestore();
      parseCommentsSpy.mockRestore();
    });

    it("Should parse the evar definition", () => {
      const result = parseRawEvar(mockRawEvar);
      expect(result.name).toBe(mockParsedDefinition.key);
      expect(result.value).toBe(mockParsedDefinition.value);
    });

    it("Should parse the evar definition", () => {
      const result = parseRawEvar(mockRawEvar);
      expect(result.description).toStrictEqual([descriptionComment.value]);
      expect(result.example).toBe(exampleComment.value);
      expect(result.requirement).toBe(requirementComment.value);
      expect(result.type).toBe(typeComment.value);
      expect(result.default).toBe(defaultComment.value);
    });

    it("Should combine description errors with comment errors", () => {
      const definitionErrors: ParseError[] = [
        {
          code: "bad-evardoc-value",
          message: "description error",
          severity: "fatal",
        },
      ];
      const commentErrors: ParseError[] = [
        {
          code: "empty-line",
          message: "comment error",
          severity: "warning",
        },
      ];

      mockParsedDefinition.errors = definitionErrors;
      mockParsedComments[0].errors = commentErrors;
      parseDefinitionSpy.mockReturnValue(mockParsedDefinition);
      parseCommentsSpy.mockReturnValue(mockParsedComments);
      const result = parseRawEvar(mockRawEvar);
      expect(result.errors).toStrictEqual([
        ...definitionErrors,
        ...commentErrors,
      ]);
    });
  });

  describe("findDescription", () => {
    const descriptionValue = "mock description";
    const mockComments: ParsedEvarComment[] = [];
    let findCommentSpy: jest.SpyInstance;
    beforeEach(() => {
      findCommentSpy = jest
        .spyOn(envParser, "findComment")
        .mockImplementation();
    });
    afterEach(() => {
      jest.clearAllMocks();
    });
    it("Should return null when the comments do not contain a description comment", () => {
      findCommentSpy.mockReturnValue(null);
      const result = findDescription(mockComments);
      expect(findCommentSpy).toBeCalledWith(mockComments, "description");
      expect(result).toBeNull();
    });
    it("Should wrap the description in an array", () => {
      findCommentSpy.mockReturnValue(descriptionValue);
      const result = findDescription(mockComments);
      expect(findCommentSpy).toBeCalledWith(mockComments, "description");
      expect(result).toStrictEqual([descriptionValue]);
    });
    it("Should return the description as-is when its an array", () => {
      findCommentSpy.mockReturnValue([descriptionValue]);
      const result = findDescription(mockComments);
      expect(findCommentSpy).toBeCalledWith(mockComments, "description");
      expect(result).toStrictEqual([descriptionValue]);
    });
  });

  describe("findRequirementComment", () => {
    const mockComments: ParsedEvarComment[] = [];
    let findCommentSpy: jest.SpyInstance;
    beforeEach(() => {
      findCommentSpy = jest
        .spyOn(envParser, "findComment")
        .mockImplementation();
    });
    afterEach(() => {
      jest.clearAllMocks();
    });
    afterAll(() => {
      findCommentSpy.mockRestore();
    });
    it("Should return the comment when it is a valid evardoc requirement comment", () => {
      const requirementComment = EvarRequirements.optional;
      findCommentSpy.mockReturnValue(requirementComment);
      const result = findRequirementComment(mockComments);
      expect(findCommentSpy).toBeCalledTimes(1);
      expect(findCommentSpy).toBeCalledWith(mockComments, "requirement");
      expect(result).toBe(requirementComment);
    });

    it("Should return null when the comment is not found in the collection", () => {
      findCommentSpy.mockReturnValue(null);
      const result = findRequirementComment(mockComments);
      expect(result).toBeNull();
    });
  });

  describe("findTypeComment", () => {
    const mockComments: ParsedEvarComment[] = [];
    let findCommentSpy: jest.SpyInstance;
    beforeEach(() => {
      findCommentSpy = jest
        .spyOn(envParser, "findComment")
        .mockImplementation();
    });
    afterEach(() => {
      jest.clearAllMocks();
    });
    afterAll(() => {
      findCommentSpy.mockRestore();
    });
    it("Should return the comment when it is a valid evardoc type comment", () => {
      const typeComment = EvarTypes.boolean;
      findCommentSpy.mockReturnValue(typeComment);
      const result = findTypeComment(mockComments);
      expect(findCommentSpy).toBeCalledTimes(1);
      expect(findCommentSpy).toBeCalledWith(mockComments, "type");
      expect(result).toBe(typeComment);
    });

    it("Should return null when the comment is not found in the collection", () => {
      findCommentSpy.mockReturnValue(null);
      const result = findTypeComment(mockComments);
      expect(result).toBeNull();
    });
  });

  describe("findComment", () => {
    it("Should return null when the multiple comments exist with the same key", () => {
      const comments: ParsedEvarComment[] = Array(2).fill({
        key: EvarDocKeys.type,
        value: "value",
        errors: [],
      });
      const result = findComment(comments, "type");
      expect(result).toBeNull();
    });
  });

  describe("parseDefinition", () => {
    it("Should return an error result when the definition contains no equals sign, $definition", () => {
      const definition = "not-evar";
      const result = parseDefinition(definition);
      expect(result.key).toBe(definition);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe(errorType.malformedEvar);
    });

    it("Should return the key from the left of the equals and value from the right", () => {
      const key = "my";
      const value = "evar";
      const definition = `${key}=${value}`;
      const result = parseDefinition(definition);
      expect(result.key).toBe(key);
      expect(result.value).toBe(value);
      expect(result.errors).toHaveLength(0);
    });

    it("Should trim white space from the key and value", () => {
      const key = "my";
      const value = "evar";
      const definition = `    ${key}    =    ${value}    `;
      const result = parseDefinition(definition);
      expect(result.key).toBe(key);
      expect(result.value).toBe(value);
      expect(result.errors).toHaveLength(0);
    });
    it("Should handle missing keys and values", () => {
      const key = "";
      const value = "";
      const definition = `${key}=${value}`;
      const result = parseDefinition(definition);
      expect(result.key).toBe(key);
      expect(result.value).toBe(value);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("parseComments", () => {
    const descriptionLine1 = "some first line of description";
    const descriptionLine2 = "followed by second line of description";
    const type = "string";
    const requirement = "optional";
    const comments = [
      `description: ${descriptionLine1}`,
      descriptionLine2,
      `type: ${type}`,
      `requirement: ${requirement}`,
    ];

    it("Should parse each comment", () => {
      const result = parseComments(comments);
      expect(result).toHaveLength(comments.length);
      expect(result[0].key).toBe(EvarDocKeys.description);
      expect(result[0].value).toStrictEqual([
        descriptionLine1,
        descriptionLine2,
      ]);
      expect(result[0].errors).toHaveLength(0);

      expect(result[1].key).toBeNull();
      expect(result[1].value).toBe(descriptionLine2);
      expect(result[1].errors).toHaveLength(1);
      expect(result[1].errors[0]).toBe(errorType.nonEvarDocComment);

      expect(result[2].key).toBe(EvarDocKeys.type);
      expect(result[2].value).toBe(type);
      expect(result[2].errors).toHaveLength(0);

      expect(result[3].key).toBe(EvarDocKeys.requirement);
      expect(result[3].value).toBe(requirement);
      expect(result[3].errors).toHaveLength(0);
    });

    it("Should return an error when the comment is a duplicate EvarDoc comment", () => {
      const comments = [
        `${EvarDocKeys.default}: one`,
        `${EvarDocKeys.default}: two`,
      ];
      const result = parseComments(comments);
      expect(result).toHaveLength(2);
      expect(result[0].errors).toHaveLength(0);

      expect(result[1].errors).toHaveLength(1);
      expect(result[1].errors[0]).toBe(errorType.dupKey);
    });
  });

  describe("appendToDescription", () => {
    it("Should join the comment by a space when its an array", () => {
      const comment: ParsedEvarComment = {
        value: ["second", "third"],
        errors: [],
        key: null,
      };
      const description: ParsedEvarComment = {
        key: EvarDocKeys.description,
        value: "first",
        errors: [],
      };
      const result = appendToDescription(description, comment);
      expect(result.value).toStrictEqual(["first", "second third"]);
    });
  });

  describe("parseComment", () => {
    it("should return an error when the comment key is not a valid evardoc key", () => {
      const comment = `invalid:value`;
      const result = parseComment(comment);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe(errorType.nonEvarDocComment);
    });

    it.each([EvarDocKeys.type, EvarDocKeys.requirement])(
      "Should return an error when the comment is an evardoc option set with an invalid value, $key",
      (key) => {
        const comment = `${key}:invalid`;
        const result = parseComment(comment);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toBe(errorType.badEvarDocValue);
      }
    );
    it("Should convert valid uppercase keys to lowercase", () => {
      const comment = `${EvarDocKeys.description.toUpperCase()}:some info`;
      const result = parseComment(comment);
      expect(result.key).toBe(EvarDocKeys.description);
    });

    it.each([
      [EvarDocKeys.requirement, EvarRequirements.optional.toUpperCase()],
      [EvarDocKeys.type, EvarTypes.integer.toUpperCase()],
    ])(
      "Should convert valid uppercase option set values to lowercase, $key, $value",
      (key, value) => {
        const comment = `${key}:${value}`;
        const result = parseComment(comment);
        expect(result.key).toBe(key);
        expect(result.value).toBe(value.toLowerCase());
      }
    );
    it("Should not change case of non-option-set values", () => {
      const value = "SHOUTING";
      const comment = `${EvarDocKeys.description}:${value}`;
      const result = parseComment(comment);
      expect(result.key).toBe(EvarDocKeys.description);
      expect(result.value).toBe(value);
    });
  });
});
