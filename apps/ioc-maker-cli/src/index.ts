#!/usr/bin/env node

import { Command } from 'commander';
import { generateCommand } from './commands/generate';
import { analyzeCommand } from './commands/analyze';
import { visualizeCommand } from './commands/visualize';


import {initializeOneLogger} from "@notjustcoders/one-logger-client-sdk"
const program = new Command();

program
  .name('ioc-arise')
  .description('Generate type-safe IoC containers for TypeScript projects')
  .version('1.0.0');

// Register commands
program.addCommand(generateCommand);
program.addCommand(analyzeCommand);
program.addCommand(visualizeCommand);

program.parse();

// If no command is provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}