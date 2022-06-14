import * as fs from "fs/promises";
/*
  =================================================================================================
  This module is responsible for writing frmatted environment data to an environment fle.
  Data returned from the env-formatter module should be passed in here if it's to be saved to file.
  =================================================================================================
*/

export const write = async (
  content: string,
  envFilePath: string
): Promise<void> => {
  await fs.writeFile(envFilePath, content);
};
