/**
 * Logger utility for CLI output
 * Provides consistent, production-ready logging with support for verbose mode and colors
 */

// ANSI color codes for beautiful console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
};

export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    SUCCESS = 3,
    DEBUG = 4,
}

export class Logger {
    private static verbose: boolean = false;
    private static silent: boolean = false;
    private static colorsEnabled: boolean = true;

    /**
     * Initialize logger with options
     */
    static initialize(options: { verbose?: boolean; silent?: boolean; colors?: boolean } = {}): void {
        Logger.verbose = options.verbose ?? false;
        Logger.silent = options.silent ?? false;
        Logger.colorsEnabled = options.colors ?? true;
    }

    /**
     * Apply color to text
     */
    private static colorize(text: string, color: string): string {
        if (!Logger.colorsEnabled) return text;
        return `${color}${text}${colors.reset}`;
    }

    /**
     * Log an error message
     */
    static error(message: string, ...args: unknown[]): void {
        if (Logger.silent) return;
        const coloredMessage = Logger.colorize(`❌ ${message}`, colors.red + colors.bright);
        console.error(coloredMessage, ...args);
    }

    /**
     * Log a warning message
     */
    static warn(message: string, ...args: unknown[]): void {
        if (Logger.silent) return;
        const coloredMessage = Logger.colorize(`⚠️  ${message}`, colors.yellow + colors.bright);
        console.warn(coloredMessage, ...args);
    }

    /**
     * Log an info message
     */
    static info(message: string, ...args: unknown[]): void {
        if (Logger.silent) return;
        const coloredMessage = Logger.colorize(`ℹ️  ${message}`, colors.blue);
        console.log(coloredMessage, ...args);
    }

    /**
     * Log a success message
     */
    static success(message: string, ...args: unknown[]): void {
        if (Logger.silent) return;
        const coloredMessage = Logger.colorize(`✅ ${message}`, colors.green + colors.bright);
        console.log(coloredMessage, ...args);
    }

    /**
     * Log a debug message (only shown in verbose mode)
     */
    static debug(message: string, ...args: unknown[]): void {
        if (Logger.silent || !Logger.verbose) return;
        const coloredMessage = Logger.colorize(`🔍 ${message}`, colors.gray);
        console.log(coloredMessage, ...args);
    }

    /**
     * Log a plain message without prefix (for structured output)
     */
    static log(message: string, ...args: unknown[]): void {
        if (Logger.silent) return;
        console.log(message, ...args);
    }

    /**
     * Log a message with custom emoji/prefix and optional color
     */
    static custom(prefix: string, message: string, color?: string, ...args: unknown[]): void {
        if (Logger.silent) return;
        const coloredPrefix = color ? Logger.colorize(prefix, color) : prefix;
        const output = `${coloredPrefix} ${message}`;
        console.log(output, ...args);
    }

    /**
     * Log a section header
     */
    static section(title: string): void {
        if (Logger.silent) return;
        const separator = Logger.colorize('─'.repeat(50), colors.cyan);
        const coloredTitle = Logger.colorize(title, colors.cyan + colors.bright);
        console.log(`\n${separator}`);
        console.log(`  ${coloredTitle}`);
        console.log(`${separator}\n`);
    }

    /**
     * Log a newline
     */
    static newline(): void {
        if (Logger.silent) return;
        console.log('');
    }

    /**
     * Format error for display
     */
    static formatError(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }

    /**
     * Check if verbose mode is enabled
     */
    static isVerbose(): boolean {
        return Logger.verbose;
    }

    /**
     * Colorize text (public method for advanced usage)
     */
    static colorizeText(text: string, color: string): string {
        return Logger.colorize(text, color);
    }

    /**
     * Get color codes (for advanced usage)
     */
    static getColors() {
        return colors;
    }
}

