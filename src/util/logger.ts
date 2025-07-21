export enum LogLevel { TRACE=0, DEBUG, INFO, WARN, ERROR }


export const logger = {
  level: LogLevel.INFO,
  setLevel(l: LogLevel) { this.level = l; },
  log(l: LogLevel, msg: string, meta?: any) {
    if (l < this.level) return;
    const tag = LogLevel[l];
    // eslint-disable-next-line no-console
    console.log(`[websphere][${tag}] ${msg}` + (meta ? ` ${JSON.stringify(meta)}` : ''));
  },
  info(msg: string, meta?: any) { this.log(LogLevel.INFO, msg, meta); },
  warn(msg: string, meta?: any) { this.log(LogLevel.WARN, msg, meta); },
  error(msg: string, meta?: any) { this.log(LogLevel.ERROR, msg, meta); },
  debug(msg: string, meta?: any) { this.log(LogLevel.DEBUG, msg, meta); },
};