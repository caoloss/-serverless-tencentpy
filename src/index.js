'use strict';

const commands = require('./commands');
const buildConfig = require('./libs/config');
const CLI = require('./libs/cli');
const { isProjectPath, loadTencentGlobalConfig } = require('./libs/utils');

module.exports = async () => {
  const config = buildConfig();
  const cli = new CLI(config);

  if (process.argv.length === 2 && !(await isProjectPath(process.cwd()))) {
    return require('./libs/auto')(config, cli);
  }

  loadTencentGlobalConfig(config, cli);
  const command = config.command;

  try {
    if (!config.command) {
      throw new Error(
        '检测到当前目录下已有 serverless 项目，请通过 "sls deploy" 进行部署，或在新路径下完成 serverless 项目初始化'
      );
    }
    if (commands[command]) {
      await commands[command](config, cli, command);
    } else {
      await commands.run(config, cli, command);
    }
  } catch (error) {
    process.exitCode = 1;
    if (error.isWarning) {
      cli.logWarning(error);
    } else if (error.isTypeError) {
      cli.logTypeError(error.typeErrors);
    } else if (cli.isSessionActive()) {
      cli.sessionStop('error', error);
    } else {
      cli.logError(error);
      cli.log();
    }
  }

  return null;
};