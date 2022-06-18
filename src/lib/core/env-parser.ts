import * as fs from "fs/promises";
import {
  Evar,
  EvarDocKey,
  EvarDocKeys,
  EvarRequirement,
  EvarType,
  isEvarDocKey,
  isEvarRequirement,
  isEvarType,
} from "./types";
import { EOL } from "os";

/*
  ============================================================================
  This module is responsible for parsing environment files into typed objects.
  ============================================================================
*/

/**
 * The code that identifies the error
 */
type ParseErrorCode =
  | "duplicate-doc-key"
  | "malformed-environment-variable"
  | "bad-evardoc-value"
  | "non-evardoc-comment"
  | "empty-line";

/**
 * The severity of the error
 */
type ParseErrorSeverity = "warning" | "fatal";

/**
 * An error that occurred while parsing an environment variable
 */
export type ParseError = {
  /**
   * The code that identifies the error
   */
  code: ParseErrorCode;
  /**
   * The severity of the error
   */
  severity: ParseErrorSeverity;
  /**
   * A user-friendly message that explains what the error means
   */
  message: string;
};

/**
 * The types of error that are handled during parsing.
 */
const errorType: Record<
  | "dupKey"
  | "malformedEvar"
  | "nonEvarDocComment"
  | "badEvarDocValue"
  | "emptyLine",
  ParseError
> = {
  dupKey: {
    code: "duplicate-doc-key",
    severity: "fatal",
    message:
      "The EvarDoc comment is declared multiple times on the same environment variable. Unable to determine which one should be used.",
  },
  malformedEvar: {
    code: "malformed-environment-variable",
    severity: "fatal",
    message:
      'The environment variable does not appear to be a valid value in the format of "key=value". Unable to parse it.',
  },
  nonEvarDocComment: {
    code: "non-evardoc-comment",
    severity: "warning",
    message:
      "The comment does not appear to be an EvarDoc doc comment. Ignoring it.",
  },
  badEvarDocValue: {
    code: "bad-evardoc-value",
    severity: "fatal",
    message:
      "The value applied for the EvarDoc comment is not a valid value. Unable to parse it.",
  },
  emptyLine: {
    code: "empty-line",
    message: "The line contains no data. Ignoring it.",
    severity: "warning",
  },
};

/**
 * The result from processing a single environment variable doc block, including
 * any errors that may have occurred during the parsing process.
 */
export type ParsedEvar = Evar & {
  errors: ParseError[];
};

/**
 * The result from parsing an environment file
 */
export type ParseResult = {
  /**
   * The parsed variables, including any errors that occurred during the parsing process
   */
  variables: Array<ParsedEvar>;
  /**
   * Whether or not the entire environment file was successfully parsed.
   * Note that errors with a severity of `warning` will not cause this to be set to `false`.
   */
  success: boolean;
};

/**
 * Regex to determine if a string represents a comment.
 * i.e. starts with *whitespace-or-nothing* + *#* + *whitespace-or-nothing*.
 *
 * Example matches:
 *  - "#"
 *  - "#&nbsp;&nbsp;&nbsp;&nbsp;"
 *  - "&nbsp;&nbsp;&nbsp;&nbsp;#"
 *  - "&nbsp;&nbsp;&nbsp;&nbsp;#&nbsp;&nbsp;&nbsp;&nbsp;"
 */
const commentPrefixRegex = new RegExp("^[ ]*[#][ ]*");

/**
 * Checks if the given string appears to be a comment.
 * @param line The line to be checked
 * @returns True when the line appears to be a comment based on the `commentStartRegex`, otherwise false.
 */
const isComment = (line: string) => !!line.match(commentPrefixRegex);
/**
 * Checks if the given string appears to contain only white space
 * @param line The line to be checked
 * @returns True when the string contains only whit space, otherwise false.
 */
const isNullOrWhiteSpace = (line: string) => !line || line.trim() === "";

/**
 * Reads the environment file and returns the parsed contents
 * @param envFilePath The absolute path to the environment file to be parsed
 */
export const parse = async (envFilePath: string): Promise<ParseResult> => {
  const content = await fs.readFile(envFilePath, "utf-8");
  const rawEvars = getRawEvars(content);
  const variables = rawEvars.map((rawEvar) => parseRawEvar(rawEvar));
  const success = variables.some(
    (p) => !p.errors.find((e) => e.severity !== "warning")
  );

  return { success, variables };
};

/**
 * A raw environment variable parsed from an environment file.
 * This is used in the early stages of parsing
 */
type RawEvar = {
  /**
   * The line containing the variable key and value.
   * @example MY_VAR=123
   */
  definition: string;
  /**
   * The comments that are written above the environment variable definition,
   * regardless of whether or not they are EvarDoc comments.
   */
  comments: string[];
};

/**
 * Parsed the environment file contents into raw environment variable data
 * @param content The content of the environment file
 * @returns The semi-parsed, mostly-raw variables
 */
const getRawEvars = (content: string): Array<RawEvar> => {
  const rawEvars: Array<RawEvar> = [];
  const initCurrent = (): RawEvar => ({ comments: [], definition: "" });

  let current = initCurrent();
  for (const line of content.split(EOL)) {
    if (isNullOrWhiteSpace(line)) {
      continue;
    } else if (isComment(line)) {
      current.comments.push(line);
    } else {
      current.definition = line;
      rawEvars.push(current);
      current = initCurrent();
    }
  }
  return rawEvars;
};

/**
 * Parsed a raw environment variable.
 * @param rawEvar The raw environment variable to be parsed
 * @returns The parsed environment variable, including any errors that occurred during the parsing process.
 */
const parseRawEvar = (rawEvar: RawEvar): ParsedEvar => {
  const definition = parseDefinition(rawEvar.definition);
  const comments = parseComments(rawEvar.comments);
  return {
    name: definition.key,
    value: definition.value,
    default: findComment(comments, "default"),
    description: findDescription(comments),
    example: findComment(comments, "example"),
    requirement: findRequirementComment(comments),
    type: findTypeComment(comments),
    errors: definition.errors.concat(comments.flatMap((c) => c.errors)),
  };
};

const findDescription = (comments: ParsedEvarComment[]): string[] | null => {
  const description = findComment(comments, "description");
  if (!description) return null;
  return typeof description === "string" ? [description] : description;
};

/**
 * Finds the `requirement` EvarDoc comment, if it exists.
 * If there are multiple, null will be returned.
 * @param comments The comments to be checked.
 * @returns The corresponding comment, or null.
 */
const findRequirementComment = (
  comments: ParsedEvarComment[]
): EvarRequirement | null => {
  const comment = findComment(comments, "requirement");
  if (comment && isEvarRequirement(comment)) return comment;
  return null;
};

/**
 * Finds the `type` EvarDoc comment, if it exists.
 * If there are multiple, null will be returned.
 * @param comments The comments to be checked.
 * @returns The corresponding comment, or null.
 */
const findTypeComment = (comments: ParsedEvarComment[]): EvarType | null => {
  const comment = findComment(comments, "type");
  if (comment && isEvarType(comment)) return comment;
  return null;
};

/**
 * Finds the comment with the specified EvarDocKey, if it exists.
 * If there are multiple, null will be returned.
 * @param comments The comments to be checked
 * @param keyType The type of EvarDoc comment
 * @returns The corresponding comment, or null
 */
const findComment = (
  comments: ParsedEvarComment[],
  keyType: EvarDocKey
): string | string[] | null => {
  const matchingType = comments.filter((c) => c.key === keyType);
  return matchingType.length === 1 ? matchingType[0].value : null;
};

/**
 * An object that represents an environment that been through the parsing process,
 * regardless of whether or not parsing was successful.
 *
 * Note that this is the environment variable only, and not any comments that are decorated on it.
 */
type ParsedEvarDefinition = {
  /**
   * The environment variable name.
   * If the variable appears to be malformed (does not follow the key=value syntax) the full line will be stored here.
   */
  key: string;
  /**
   * The value of the environment variable (i.e. the value after the first `=`, if there is one).
   */
  value: string | null;
  /**
   * The errors that occurred while parsing the variable, if any.
   */
  errors: ParseError[];
};

/**
 * Parses an environment variable definition.
 *
 * Note that this parses the environment variable ony, and not any comments that are decorated on it.
 * @param definition The line from the environment file containing the environment variable key and (potentially) value.
 * @returns The parsed environment variable definition, including any errors that occurred during the process.
 */
const parseDefinition = (definition: string): ParsedEvarDefinition => {
  const parsed: ParsedEvarDefinition = {
    errors: [],
    key: "",
    value: null,
  };

  const split = definition.split("=");
  if (!split.length) {
    parsed.key = definition;
    parsed.errors.push(errorType.malformedEvar);
    return parsed;
  }

  parsed.key = split[0]?.trim();
  parsed.value = split[1]?.trim();
  return parsed;
};

/**
 * An object that represents a comment that's been through the parsing process,
 * regardless of whether or not parsing was successful.
 *
 * Note that this is the comment only, and not the environment variable that it's associated with.
 */
type ParsedEvarComment = {
  /**
   * The key typically represents the EvarDocKey; the comment type that's supported by EvarDoc.
   * If the comment does not appear to be an EvarDoc comment, the entire comment will be stored here.
   */
  key: string | null;
  /**
   * The value of the comment (i.e. everything after the first `:`, if any).
   * If the comment doesn't have a semi-colon, it's not an EvarDoc comment, so there will be no value listed here.
   */
  value: string | string[] | null;
  /**
   * The errors that occurred while parsing the comment, if any.
   */
  errors: ParseError[];
};

type MyType = {
  value: string;
};
const test = () => {
  let optionalThing: MyType | null = null;

  if (true) {
    optionalThing = { value: "some value" };
  }

  if (true) {
    optionalThing.value;
  }
};

/**
 * Parses the comments that decorates an environment variable, regardless of whether or not they are EvarDoc comments.
 *
 * Note that this processes only the comments and not the actual environment variable.
 * @param comments The comments that decorate the environment variable and are to be parsed.
 * @returns The parsed comments, including any errors that occurred during the parsing process.
 */
const parseComments = (comments: string[]): ParsedEvarComment[] => {
  const parsedComments: ParsedEvarComment[] = [];

  // To support multi-lin descriptions, we need to keep track of the description comment
  let processingDescription = false;
  let descriptionComment: ParsedEvarComment | null = null;

  for (const comment of comments) {
    const parsedComment = parseComment(comment);

    if (isDuplicateEvarDocComment(parsedComment, parsedComments)) {
      parsedComment.errors.push(errorType.dupKey);
    }

    [descriptionComment, processingDescription] = maybeAppendToDescription(
      parsedComment,
      descriptionComment,
      processingDescription
    );

    parsedComments.push(parsedComment);
  }

  return parsedComments;
};

/**
 * Checks If the comment that we've just parsed is a known EvarDoc comment and already exists in the list of comments.
 * @param comment The comment to be checked
 * @param comments The list of comments to be checked against
 * @returns True if the comment key already exists, otherwise false.
 */
const isDuplicateEvarDocComment = (
  comment: ParsedEvarComment,
  comments: ParsedEvarComment[]
): boolean =>
  !!comment.key &&
  isEvarDocKey(comment.key) &&
  comments.some(
    (c) =>
      !c.errors.length && c.key?.toLowerCase() === comment.key?.toLowerCase()
  );

/**
 * Updates the description comment value by appending the parsed comment value
 * if `processingDescription` is true and parsedComment is not an EvarDoc comment.
 * @param comment The comment to maybe be appended to the description
 * @param descriptionComment The comment that contains the description
 * @param processingDescription Whether or not the description is currently being processed
 */
const maybeAppendToDescription = (
  comment: ParsedEvarComment,
  descriptionComment: ParsedEvarComment | null,
  processingDescription: boolean
): [ParsedEvarComment | null, boolean] => {
  // If we've just parsed the description, set the vars to indicate this
  if (comment.key === EvarDocKeys.description) {
    descriptionComment = comment;
    processingDescription = true;
  }
  // otherwise if we're currently processing the description and the parsed
  // comment IS NOT an EvarDoc comment, its part of a multi-line description
  else if (
    processingDescription &&
    descriptionComment &&
    comment.errors.some((e) => e.code === "non-evardoc-comment")
  ) {
    descriptionComment = appendToDescription(descriptionComment, comment);
  }
  // Otherwise if we're current processing the description and the parsed
  // comment IS an EvarDoc comment, we've finished processing the description
  else if (processingDescription && comment.key && isEvarDocKey(comment.key)) {
    processingDescription = false;
  }

  return [descriptionComment, processingDescription];
};

/**
 * Appends the `comment` to the `description` by adding it's value into the descriptions array of values.
 * @param description The description which is to be appended to.
 * @param comment The comment to be appended
 * @returns The updated description
 */
const appendToDescription = (
  description: ParsedEvarComment,
  comment: ParsedEvarComment
): ParsedEvarComment => {
  if (description.value && !Array.isArray(description.value))
    description.value = [description.value];

  if (description.value && Array.isArray(description.value) && comment.value)
    description.value.push(
      typeof comment.value == "string" ? comment.value : comment.value.join(" ")
    );
  return description;
};

/**
 * Parses a single comment regardless of whether or not it's an EvarDoc comment.
 * @param comment The comment to be parsed
 * @returns The parsed comment, including any errors that occurred during the parsing process.
 */
const parseComment = (comment: string): ParsedEvarComment => {
  const parsed: ParsedEvarComment = {
    errors: [],
    key: null,
    value: null,
  };
  // expecting something like:
  // # description: some info (valid EvarDoc comment)
  // # some other non-evar doc comment
  const split = comment
    .replace(commentPrefixRegex, "")
    .split(/:(.*)/s) // split at the first semicolon
    .map((c) => c.trim()) // trim white space
    .filter((c) => c); // ignore empty values

  if (split.length !== 2) {
    parsed.value = split[0];
    parsed.errors.push(errorType.nonEvarDocComment);
    return parsed;
  }

  parsed.key = split[0]?.trim();
  parsed.value = split[1]?.trim();

  const lowerKey = parsed.key.toLowerCase();
  const lowerValue = parsed.value.toLowerCase();

  if (!isEvarDocKey(lowerKey)) {
    parsed.errors.push(errorType.nonEvarDocComment);
    return parsed;
  }
  if (lowerKey === "type" && !isEvarType(lowerValue)) {
    parsed.errors.push(errorType.badEvarDocValue);
    return parsed;
  }
  if (lowerKey === "requirement" && !isEvarRequirement(lowerValue)) {
    parsed.errors.push(errorType.badEvarDocValue);
    return parsed;
  }

  return parsed;
};
