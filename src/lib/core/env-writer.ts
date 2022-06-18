import * as fs from "fs/promises";
/*
  =================================================================================================
  This module is responsible for writing formatted environment data to an environment fle.
  Data returned from the env-formatter module should be passed in here if it's to be saved to file.
  =================================================================================================
*/

/**
 * Writes the formatted environment variable data to file
 * @param content The formatted environment variable data to be written to file
 * @param envFilePath The path to the env file where the content should be written.
 */
export const write = async (
  content: string,
  envFilePath: string
): Promise<void> => {
  await fs.writeFile(envFilePath, content);
};
