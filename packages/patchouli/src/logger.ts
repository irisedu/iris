type LoggerFn = (...args: unknown[]) => void;

export interface Logger {
	note: LoggerFn;
	info: LoggerFn;
	error: LoggerFn;
	warn: LoggerFn;
	success: LoggerFn;
	await: LoggerFn;
	raw: LoggerFn;
}

function consoleBind(prefix: string): LoggerFn {
	return (...args) => console.log(`[${prefix}]`, ...args);
}

const logger: Logger = {
	note: consoleBind('note'),
	info: consoleBind('info'),
	error: consoleBind('error'),
	warn: consoleBind('warn'),
	success: consoleBind('success'),
	await: consoleBind('await'),
	raw: console.log
};

export function changeLogger(newLogger: Logger) {
	Object.assign(logger, newLogger);
}

export default logger;
