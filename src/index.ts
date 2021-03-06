#!/usr/bin/env node

import { program } from "commander";
import path from "path";
import cli from "./lib/cli";

cli(program, require(path.join(__dirname, "..", "package.json")).version);
