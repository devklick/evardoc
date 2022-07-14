import { ParsedEvar, ParseResult } from "../../../src/lib/core/env-parser";
import {
  parsedEvar1,
  parsedEvar3_WithWarnings,
  parsedEvar4_WithFatalError,
  parsedEvar5_WithWarningsAndError,
} from "../../../test/test-data";
import * as logger from "../../../src/lib/core/logger";

describe("logger", () => {
  const envFilePath = ".env";
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarningSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  beforeEach(() => {
    consoleInfoSpy = jest.spyOn(console, "info").mockImplementation();
    consoleWarningSpy = jest.spyOn(console, "warn").mockImplementation();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe("logParseResult", () => {
    let parseResult: ParseResult;
    let logParseSuccessSpy: jest.SpyInstance;
    let logParseFailureSpy: jest.SpyInstance;

    beforeEach(() => {
      parseResult = {
        success: true,
        variables: [parsedEvar1],
      };
      logParseSuccessSpy = jest
        .spyOn(logger, "logParseSuccess")
        .mockImplementation();
      logParseFailureSpy = jest
        .spyOn(logger, "logParseFailure")
        .mockImplementation();
    });
    afterEach(() => {
      jest.clearAllMocks();
    });
    afterAll(() => {
      logParseFailureSpy.mockRestore();
      logParseSuccessSpy.mockRestore();
    });
    it("Should call logParseSuccess when the result indicates successful", () => {
      const verbose = true;
      logger.logParseResult(envFilePath, parseResult, verbose);
      expect(logParseSuccessSpy).toBeCalledTimes(1);
      expect(logParseSuccessSpy).toBeCalledWith(
        envFilePath,
        parseResult.variables,
        verbose
      );
    });
    it("Should call logParseFailure when the result indicates unsuccessful", () => {
      const verbose = false;
      parseResult.success = false;
      logger.logParseResult(envFilePath, parseResult, verbose);
      expect(logParseFailureSpy).toBeCalledTimes(1);
      expect(logParseFailureSpy).toBeCalledWith(
        envFilePath,
        parseResult.variables,
        verbose
      );
    });
  });

  describe("logParseSuccess", () => {
    const variables: ParsedEvar[] = [parsedEvar1, parsedEvar3_WithWarnings];

    let logParseWarningsSpy: jest.SpyInstance;
    beforeEach(() => {
      logParseWarningsSpy = jest
        .spyOn(logger, "logParseWarnings")
        .mockImplementation();
    });
    afterEach(() => {
      jest.clearAllMocks();
    });
    afterAll(() => {
      consoleInfoSpy.mockRestore();
      logParseWarningsSpy.mockRestore();
    });
    it("Should not log anything when verbose is false", () => {
      logger.logParseSuccess(envFilePath, variables, false);
      expect(consoleInfoSpy).not.toBeCalled();
    });
    it("Should log the variables in the correct format", () => {
      // prettier-ignore
      const expected = 
`Successfully parsed ${envFilePath}
    variable: ${variables[0].name}
        description: ${variables[0].description}
        type: ${variables[0].type}
        requirement: ${variables[0].requirement}
        default: ${variables[0].default}
    variable: ${variables[1].name}
        description: ${variables[1].description}
        type: ${variables[1].type}
        requirement: ${variables[1].requirement}
        default: ${variables[1].default}
        example: ${variables[1].example}`;

      logger.logParseSuccess(envFilePath, variables, true);
      expect(consoleInfoSpy).toBeCalledWith(expected);
    });
    it("Should call logParseWarnings", () => {
      const verbose = true;
      logger.logParseSuccess(envFilePath, variables, verbose);
      expect(logParseWarningsSpy).toBeCalledTimes(1);
      expect(logParseWarningsSpy).toBeCalledWith(
        envFilePath,
        variables,
        verbose
      );
    });
  });

  describe("logParseWarnings", () => {
    let variables: ParsedEvar[];
    beforeEach(() => {
      variables = [
        parsedEvar1, // should be ignored
        parsedEvar3_WithWarnings, // should be logged
        parsedEvar5_WithWarningsAndError, // only warnings should be logged
      ];
    });
    it("Should not log anything when verbose is false", () => {
      logger.logParseWarnings(envFilePath, variables, false);
      expect(consoleWarningSpy).not.toBeCalled();
    });
    it("Should not log anything when there are no warnings", () => {
      logger.logParseWarnings(envFilePath, [parsedEvar1], true);
      expect(consoleWarningSpy).not.toBeCalled();
    });
    it("Should log the warnings in the expected format", () => {
      // prettier-ignore
      const expected = 
`Encountered warnings while parsing ${envFilePath}
    variable: ${variables[1].name}
        ${variables[1].errors[0].message} (${variables[1].errors[0].code})
    variable: test 5
        ${variables[2].errors[0].message} (${variables[2].errors[0].code})`;

      logger.logParseWarnings(envFilePath, variables, true);
      expect(consoleWarningSpy).toBeCalledWith(expected);
    });
  });

  describe("logParseFailure", () => {
    let variables: ParsedEvar[];
    beforeEach(() => {
      variables = [
        parsedEvar1, // should be ignored
        parsedEvar3_WithWarnings, // should be ignored
        parsedEvar4_WithFatalError, // should be logged
        parsedEvar5_WithWarningsAndError, // only non-warnings should be logged
      ];
    });

    it("Should log the errors even if verbose is false", () => {
      logger.logParseFailure(envFilePath, variables, false);
      expect(consoleErrorSpy).toBeCalled();
    });
    it("Should not log anything when there are no non-warning errors", () => {
      logger.logParseFailure(envFilePath, [parsedEvar1], true);
      expect(consoleErrorSpy).not.toBeCalled();
    });

    it("Should log the errors in the expected format", () => {
      // prettier-ignore
      const expected = 
`Failed to parse ${envFilePath}
    variable: ${variables[2].name}
        ${variables[2].errors[0].message} (${variables[2].errors[0].code})
    variable: test 5
        ${variables[3].errors[1].message} (${variables[3].errors[1].code})`;
      logger.logParseFailure(envFilePath, variables, true);
      expect(consoleErrorSpy).toBeCalledWith(expected);
    });
  });
});
