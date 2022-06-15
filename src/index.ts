import { program } from "commander";
import cli from "./lib/cli";

cli(program, require("../package.json").version);
