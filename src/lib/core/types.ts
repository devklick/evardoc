/**
 * The valid keys that can be used in EvarDoc comments
 */
export const EvarDocKeys = {
  /**
   * The description that explains the what the environment variable is
   */
  description: "description",
  /**
   * The type of data that the environment variable represents
   */
  type: "type",
  /**
   * The level of requirement for the environment variable
   */
  requirement: "requirement",
  /**
   * An example value for the environment variable
   */
  example: "example",
  /**
   * The default value that is used for the environment variable
   */
  default: "default",
} as const;

/**
 * The documentation keys that are supported
 */
export type EvarDocKey = typeof EvarDocKeys[keyof typeof EvarDocKeys];

export const isEvarDocKey = (value: string): value is EvarDocKey =>
  value in EvarDocKeys;

/**
 * The type of data that the environment variable represents
 */
export const EvarTypes = {
  string: "string",
  integer: "integer",
  decimal: "decimal",
  boolean: "boolean",
} as const;

/**
 * The type of data that the environment variable represents
 */
export type EvarType = typeof EvarTypes[keyof typeof EvarTypes];

/**
 * Checks if a given value is an `EvarType`, i.e., is a valid data type.
 * @param value The value to be checked
 * @returns
 */
export const isEvarType = (value: unknown): value is EvarType =>
  typeof value === "string" && value in EvarTypes;

/**
 * The level of requirement for the environment variable
 */
const EvarRequirements = {
  required: "required",
  optional: "optional",
} as const;

/**
 * The level of requirement for the environment variable
 */
export type EvarRequirement =
  typeof EvarRequirements[keyof typeof EvarRequirements];
export const isEvarRequirement = (value: unknown): value is EvarRequirement =>
  typeof value === "string" && value in EvarRequirements;

/**
 * The structure of the environment variable metadata
 */
export type EvarDocBlock = {
  /**
   * The description that explains the what the environment variable is
   */
  description: string[] | null;
  /**
   * The type of data that the environment variable represents
   */
  type: EvarType | null;
  /**
   * The level of requirement for the environment variable
   */
  requirement: EvarRequirement | null;
  /**
   * An example value for the environment variable
   *
   * **NOTE** this should be a value that safe to be used in documentation
   */
  example: unknown | null;
  /**
   * The default value that is used for the environment variable
   *
   * **NOTE** this should be a value that safe to be used in documentation
   */
  default: unknown | null;
};

export type Evar = EvarDocBlock & {
  /**
   * The name of the environment variable.
   * i.e. the value before the `=`.
   */
  name: string;
  /**
   * The value of the environment variable, if there is one.
   * i.e the value after the `=`
   */
  value: string | null;
};
