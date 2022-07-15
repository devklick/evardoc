<h1 align="center">
    EvarDoc
</h1>

<p align="center">
    Document your JS/TS environment variables.
</p>
<br/>
<br/>
<br/>
<br/>

# Test coverage
![Statements](https://img.shields.io/badge/statements-100%25-brightgreen.svg?style=flat)
![Branches](https://img.shields.io/badge/branches-100%25-brightgreen.svg?style=flat)
![Functions](https://img.shields.io/badge/functions-100%25-brightgreen.svg?style=flat)
![Lines](https://img.shields.io/badge/lines-100%25-brightgreen.svg?style=flat)

# Contents
- [Test coverage](#test-coverage)
- [Contents](#contents)
- [What it is](#what-it-is)
- [Supports the following documentation](#supports-the-following-documentation)
- [Example documented environment file](#example-documented-environment-file)
- [Installation](#installation)
- [Adding a pre-commit hook](#adding-a-pre-commit-hook)
- [Formatting your environment file](#formatting-your-environment-file)
  - [Specifying the file to be formatted](#specifying-the-file-to-be-formatted)
- [Creating an environment file template](#creating-an-environment-file-template)
  - [Specifying the source of the template](#specifying-the-source-of-the-template)
  - [Specifying the destination of the template](#specifying-the-destination-of-the-template)
  - [Overwrite vs merge](#overwrite-vs-merge)
- [Future plans](#future-plans)

# What it is

A CLI that builds a template of your environment variables file(s) (excluding the variable values) so they can be documented and committed to source control to help other developers working on the codebase. Supports various annotations in the form of hashtag comments, and additionally, it can format your environment file(s) to apply a consistent, opinionated format.

# Supports the following documentation
- `description` - A description that explains the what the environment variable is
- `type` The type of data that the environment variable represents (`string`, `integer`, `decimal`, `boolean`)
- `requirement` - The level of requirement for the variable (`required`, `optional`)
- `example` An example of the variable value
- `default` - A default value that's applied in the code that uses the variable

Each comment key is optional, and each can only be used once per envrionment variable.


# Example documented environment file
```shell
# description: some description about some int.
# Since this is a really long description, it's split into multiple lines.
# This is totally OK and the line breaks will be preserved.
# type: integer
# requirement: required
# example: 456
SOME_INT=123

# description: some description about some decimal
# type: decimal
# requirement: required
# example: 56.78
SOME_DECIMAL=34.56

# description: some description about some optional bool
# type: boolean
# requirement: optional
# example: true
# default: false
SOME_BOOLEAN=

# description: some description about some optional string
# type: string
# requirement: optional
# example: something
SOME_STRING=
```
**NOTES**:
- This has been through the formatter, so the order of doc keys, the white space etc are all consistent
- Multi-line comments are supported for `description` only

# Installation
To add EvarDoc to your project, install the [EvarDoc npm package](https://www.npmjs.com/package/evardoc) as a dev dependency:
```
npm i -D evardoc
```
Add npm scripts to execute EvarDoc, for example:
```json
"scripts": {
    "evardoc:format": "evardoc format",
    "evardoc:template": "evardoc template"
}
```
And execute the npm scripts:
```
npm run evardoc:format
npm run evardoc:template
```

# Adding a pre-commit hook
If you are planning on adopting EvarDoc, it's best to set up a pre-commit hook to run the commands on every commit. One approach to doing so is to use [husky](https://github.com/typicode/husky).
```
npm i -D husky
npm set-script prepare 'husky install'
npx husky add .husky/pre-commit 'npm run evardoc:format && npm run evardoc:template && git add template.env'
git add .husky/pre-commit
```
Now, whenever you commit any changes to your repository, your environment variables file will be formatted and a template will be created/updated and added to your commit.

**NOTE:**
The last part of the command, `git add template.env` assumes you do not specify a custom path to the destination of your template. If you decide to use a custom path (see [Specifying the destination of the template](#specifying-the-destination-of-the-template)), you should replace `template.env` with the path to your template.

# Formatting your environment file
The `format` command allows you to format an environment variables file. Formatting will apply consistent white spaces across all your environment variables and EvarDoc comments, as well as maintaining a consistent order of EvarDoc comments. The order is as described in the ["Supports the following documentation"](#supports-the-following-documentation) section of the readme.

Example:
```
npm run evardoc:format
```

## Specifying the file to be formatted
By default, executing the `format` command will format the file named `.env`. Instead, if you want to format a different file, you can specifying the path to the file immediately after the `format` command. For example
```
npm run evardoc:format test.env
``` 

# Creating an environment file template
The `template` command allows you create a formatted environment variable template file that excludes the variable values, so that the template can be committed to your repository and used by others working on the codebase.

Example:
```
npm run evardoc:template
```

## Specifying the source of the template
By default, executing the `template` command will pull variables from the file named `.env`. Instead, if you want to use a different file, you can specifying the path to the file immediately after the `template` command. For example
```
npm run evardoc:template test.env
``` 
## Specifying the destination of the template
By default, the template will be written to a file named `template.env`. If you want to write your template to different file, you can specify the `-d` (`--destination`) option. For example:
```
npm run evardoc:template -- -d my-template.env
```

Note that since we're passing in an extra option via an npm script, we have to first specify the `--` separator.

## Overwrite vs merge
By default, if the destination template file already exists, it will not be overwritten. Instead, new variables that exist in your environment variables source file will be appended to the bottom of the existing template file. Additionally, any environment variables that exist in both the source environment file and destination template will be updated in the template. Optionally, you can specify the `-o` (`--overwrite`) flag to force any existing `template.env` file to be completely overwritten with the contents of the new template.

**NOTES:** 

- If other people work in the same repository, it is recommended to avoid the `-o` (`--overwrite`) option. Otherwise, you may find that since you and your teammates's may only use a subset of supported variables, so you'll each end up creating and committing different templates.

- The main reason for creating an environment file template is committing to your repository and sharing with other users, without worrying about sharing variable values. As such, you will likely need to add your `template.env` to your `.gitignore` rules.

# Future plans
- [ ] Have an option to run both `format` and `template` in the same command (currently this has to be done as two separate commands, causing your env file to be parsed each time)
- [ ] VSCode extension to apply syntax-highlighting and auto-complete for EvarDoc keywords, as well as format on save
- [ ] Option to automatically add Environment Variables markdown table to readme
- [ ] Implement custom arg parsing and remove dependency on Commander