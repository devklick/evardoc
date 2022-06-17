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

# What it is

A CLI that builds a template of your environment variables file(s) so (excluding the variable values) they can be documented committed to source control to aid other developers working on the codebase. Additionally, it can format your environment file(s) to apply a consistent format.

# Supports the following documentation
- `description` - A description that explains the what the environment variable is
- `type` The type of data that the environment variable represents (`string`, `integer`, `decimal`, `boolean`)
- `requirement` - The level of requirement for the variable (`required` or `optional`)
- `example` An example of the variable value
- `default` - A default value that's applied in the code that uses the variable

# Example Documented Environment File
```
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

# Formatting your environment file
Currently the best way to do this is by checking out the repository and running the following
```
npm run dev format .env
```
This executes the `format` command against the `.env` file.
# Creating an environment file template
Currently, the best way to do this is by checking out the repository and running the following:
```
npm run dev template .env
```
This executes the `template` command against the `.env` file.

Optionally, you can specify the `-o` (`--overwrite`) flag to indicate that you want to completely overwrite any existing template file. 

**NOTE:** if other people work in the same repository, it is recommended to avoid this and use the default merge approach, where ony new variables from the `.env` file will be added to the bottom of the existing template. 

**NOTE:** The main reason for creating an environment file template is committing to your repository and sharing with other users, without worrying about sharing variable values. As such, you will likely need to add your `template.env` to your `.gitignore` rules.

# Future Plans
- [ ] Option to specify template file name (currently only supports hardcoded `template.env`)
- [ ] Have an option to run both `format` and `template` in the same command (currently this has to be done as two separate commands, causing your env file to be parsed each time)
- [ ] Support updating existing template variables using the default merge (non overwrite) approach
- [ ] Publish as an npm package
- [ ] VSCode extension to apply syntax-highlighting and  auto-complete for EvarDoc keywords, as well as format on save
