import { EOL } from "os";
import { ParsedEvar, ParseError } from "src/lib/core/env-parser";
import {
  addBlock,
  addEvar,
  addEvarDocComment,
  applyFormat,
  formatTemplate,
} from "../../../src/lib/core/env-formatter";
import * as envFormatter from "../../../src/lib/core/env-formatter";

describe("env-formatter", () => {
  let evar1: ParsedEvar;
  let evar2: ParsedEvar;
  let evar3: ParsedEvar;
  beforeEach(() => {
    evar1 = {
      description: ["some test description for evar 1"],
      type: "string",
      requirement: "required",
      default: "default value",
      example: "example value",
      name: "VAR_NAME",
      value: "VAR_VALUE",
      errors: [],
    };
    evar2 = {
      description: ["some test description for evar 2"],
      type: "boolean",
      requirement: "optional",
      default: false,
      example: true,
      name: "VAR_NAME_2",
      value: "true",
      errors: [],
    };
    evar3 = {
      description: ["some test description for evar 3"],
      type: "integer",
      requirement: "optional",
      default: 1,
      example: 2,
      name: "VAR_NAME_3",
      value: "9",
      errors: [],
    };
  });
  describe("addEvarDocComment", () => {
    let lines: string[];
    let key: string;
    let value: unknown;

    beforeEach(() => {
      lines = [];
      key = "EvarDocKey";
      value = 1;
    });

    it("Should only add the EvarDoc comment if it has a value", () => {
      value = null;
      const beforeLines = [...lines];
      addEvarDocComment(lines, key, value);
      expect(lines).toStrictEqual(beforeLines);
    });

    it("Should join the array using EOL when it is an array", () => {
      value = [1, 2, 3];
      addEvarDocComment(lines, key, value);
      expect(lines[0]).toStrictEqual(`# ${key}: ${1}${EOL}# ${2}${EOL}# ${3}`);
    });

    it("Should use the value as specified when not an array", () => {
      addEvarDocComment(lines, key, value);
      expect(lines[0]).toStrictEqual(`# ${key}: ${value}`);
    });
  });

  describe("addEvar", () => {
    let lines: string[];
    let key: string;
    let value: string | null;

    beforeEach(() => {
      lines = [];
      key = "SOME_KEY";
      value = "SOME_VALUE";
    });
    it("Should add the environment variable to the array", () => {
      addEvar(lines, key, value);
      expect(lines[0]).toStrictEqual(`${key}=${value}`);
    });
    it("Should default an nullish value to an empty string", () => {
      value = null;
      addEvar(lines, key, value);
      expect(lines[0]).toStrictEqual(`${key}=`);
    });
  });

  describe("addBlock", () => {
    let blocks: string[];
    let evar: ParsedEvar;
    let excludeVariableValues: boolean;
    let parseError: ParseError;
    beforeEach(() => {
      blocks = [];
      evar = evar1;
      excludeVariableValues = false;
      parseError = {
        code: "bad-evardoc-value",
        message: "whatever",
        severity: "fatal",
      };
    });
    it("Should not add the evar if it contains errors that are not warnings", () => {
      evar.errors = [{ ...parseError, severity: "fatal" }];
      const beforeBlocks = [...blocks];
      addBlock(blocks, evar, excludeVariableValues);
      expect(blocks).toStrictEqual(beforeBlocks);
    });
    it("Should add the evar if it contains errors that are just warnings", () => {
      evar.errors = [{ ...parseError, severity: "warning" }];
      const beforeBlocksLength = blocks.length;
      addBlock(blocks, evar, excludeVariableValues);
      expect(blocks).toHaveLength(beforeBlocksLength + 1);
    });
    it("Should include the variable value when excludeVariableValues is false", () => {
      const expected = [
        `# description: ${evar.description?.join(`${EOL}#`)}`,
        `# type: ${evar.type}`,
        `# requirement: ${evar.requirement}`,
        `# default: ${evar.default}`,
        `# example: ${evar.example}`,
        `${evar.name}=${evar.value}`,
      ].join(EOL);

      addBlock(blocks, evar, false);
      expect(blocks[0]).toStrictEqual(expected);
    });
    it("Should exclude the variable value when excludeVariableValues is true", () => {
      const expected = [
        `# description: ${evar.description?.join(`${EOL}#`)}`,
        `# type: ${evar.type}`,
        `# requirement: ${evar.requirement}`,
        `# default: ${evar.default}`,
        `# example: ${evar.example}`,
        `${evar.name}=`,
      ].join(EOL);

      addBlock(blocks, evar, true);
      expect(blocks[0]).toStrictEqual(expected);
    });
  });
  describe("applyFormat", () => {
    let evars: ParsedEvar[];
    let existingTemplateEvars: ParsedEvar[] | null;
    let excludeVariableValues: boolean;
    let addBlockSpy: jest.SpyInstance;

    beforeEach(() => {
      evars = [evar1, evar2];
      excludeVariableValues = false;
      existingTemplateEvars = [evar3];
      addBlockSpy = jest.spyOn(envFormatter, "addBlock");
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("Should add the existing template evars first when they are provided", () => {
      applyFormat(evars, excludeVariableValues, existingTemplateEvars);
      expect(addBlockSpy).toHaveBeenNthCalledWith(
        1,
        expect.any(Array),
        existingTemplateEvars![0], // existing vars first
        excludeVariableValues
      );
      expect(addBlockSpy).toHaveBeenNthCalledWith(
        2,
        expect.any(Array),
        evars[0], // new vars second first
        excludeVariableValues
      );
    });
    it("Should use the new evar info when its provided in both the existing template evars and the new evars", () => {
      // same variable in new and existing vars
      existingTemplateEvars![0].name = evars[0].name;
      applyFormat(evars, excludeVariableValues, existingTemplateEvars);
      expect(addBlockSpy).toHaveBeenNthCalledWith(
        1,
        expect.any(Array),
        evars[0], // new var used first
        excludeVariableValues
      );
    });
    it("Should not add new evar if its already included in the existing template evars", () => {
      // same variable in new and existing vars
      existingTemplateEvars![0].name = evars[0].name;
      applyFormat(evars, excludeVariableValues, existingTemplateEvars);
      expect(addBlockSpy).not.toBeCalledWith(
        expect.anything(),
        existingTemplateEvars![0], // new var used first
        excludeVariableValues
      );
    });
    it("Should default the excludeVariableValues parameter to false", () => {
      applyFormat(evars);
      expect(addBlockSpy).toBeCalledWith(
        expect.any(Array),
        expect.any(Object),
        false
      );
    });
  });

  describe("formatTemplate", () => {
    const parsedEvars = [evar1, evar2];
    const existingEvars = [evar3];
    let applyFormatSpy: jest.SpyInstance;
    beforeEach(() => {
      applyFormatSpy = jest
        .spyOn(envFormatter, "applyFormat")
        .mockImplementation();
    });
    afterEach(() => {
      jest.clearAllMocks();
    });
    it("Should call the applyFormat function with the correct parameters", () => {
      formatTemplate(parsedEvars, existingEvars);
      expect(applyFormatSpy).toBeCalledTimes(1);
      expect(applyFormatSpy).toBeCalledWith(parsedEvars, true, existingEvars);
    });

    it("Should default existingTemplateParsedEvars to null", () => {
      formatTemplate(parsedEvars);
      expect(applyFormatSpy).toBeCalledTimes(1);
      expect(applyFormatSpy).toBeCalledWith(parsedEvars, true, null);
    });
  });
});
