import { program } from "commander";
import cli from "./src/lib/cli";

cli(program, require("./package.json").version);
