import * as fs from "fs/promises";
import { write } from "../../../src/lib/core/env-writer";

jest.mock("fs/promises");

const mockFs = jest.mocked(fs, true);

describe("envWriter", () => {
  describe("write", () => {
    let content: string;
    let envFilePath: string;
    beforeEach(() => {
      content = "something to write";
      envFilePath = "my.env";
    });
    it("Should attempt to write the file with the expected parameters", async () => {
      await write(content, envFilePath);
      expect(mockFs.writeFile).toBeCalledTimes(1);
      expect(mockFs.writeFile).toBeCalledWith(envFilePath, content);
    });
  });
});
