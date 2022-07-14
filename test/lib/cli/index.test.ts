import cli, { cliMetadata } from "../../../src/lib/cli";
import commands from "../../../src/lib/cli/commands";
import { program } from "commander";

jest.mock("commander");
jest.mock("../../../src/lib/cli/commands");

const mockProgram = jest.mocked(program, true);
const mockCommands = jest.mocked(commands, true);

describe("cli", () => {
  beforeEach(() => {
    mockProgram.name = jest.fn().mockReturnValue(mockProgram);
    mockProgram.description = jest.fn().mockReturnValue(mockProgram);
    mockProgram.version = jest.fn().mockReturnValue(mockProgram);
  });
  it("Should have a default export that is a function", async () => {
    expect(cli).toBeInstanceOf(Function);
  });
  it("Should register the program metadata", () => {
    const version = "1";
    cli(mockProgram, version);
    expect(mockProgram.name).toBeCalledWith(cliMetadata.name);
    expect(mockProgram.description).toBeCalledWith(cliMetadata.description);
    expect(mockProgram.version).toBeCalledWith(version);
    expect(mockCommands.format.register).toBeCalledWith(mockProgram);
    expect(mockCommands.template.register).toBeCalledWith(mockProgram);
  });

  describe("cliMetadata", () => {
    it("Should be called EvarDoc", () => {
      expect(cliMetadata.name).toStrictEqual("EvarDoc");
    });
    it("Should have a sensible description", () => {
      expect(cliMetadata.description).toStrictEqual(
        "Documentation of environment variables made easy"
      );
    });
  });
});
