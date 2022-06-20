import { program } from "commander";
import path from "path";
import cli from "./src/lib/cli";

cli(program, require(path.join(__dirname, "package.json")).version);
