#!/usr/bin/env node
import { run } from "./cli.js";
import { installFatalHandlers } from "./lib/fatal.js";

installFatalHandlers();
void run();
