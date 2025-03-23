const fs = require('fs');
const path = require('path');

class Logger {
  constructor(logFilePath) {
    this.logFilePath = logFilePath;

    // 初始化日志文件
    if (!fs.existsSync(this.logFilePath)) {
      const initialContent = `<?xml version="1.0" encoding="UTF-8"?>\n<logs></logs>`;
      fs.writeFileSync(this.logFilePath, initialContent, 'utf8');
    }
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `
  <log>
    <timestamp>${timestamp}</timestamp>
    <level>${level}</level>
    <message>${message}</message>
  </log>`;

    // 读取现有日志文件内容
    const existingContent = fs.readFileSync(this.logFilePath, 'utf8');
    const updatedContent = existingContent.replace(
      '</logs>',
      `${logEntry}\n</logs>`
    );

    // 写入更新后的日志内容
    fs.writeFileSync(this.logFilePath, updatedContent, 'utf8');
  }

  info(message) {
    this.log('INFO', message);
  }

  warning(message) {
    this.log('WARNING', message);
  }

  error(message) {
    this.log('ERROR', message);
  }
}

module.exports = Logger;
