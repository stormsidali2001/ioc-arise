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

// If no command is provided, default to 'generate'
const args = process.argv.slice(2);
const knownCommands = ['generate', 'analyze', 'visualize', '-h', '--help', '-V', '--version'];
const firstArg = args[0];

if (args.length === 0) {
  // No arguments provided, default to 'generate'
  process.argv.splice(2, 0, 'generate');
} else if (firstArg && !knownCommands.includes(firstArg)) {
  // First argument is not a known command, assume it's a flag and prepend 'generate'
  if (firstArg.startsWith('-')) {
    process.argv.splice(2, 0, 'generate');
  }
}

program.parse();