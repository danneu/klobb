
// 3rd
import chalk from 'chalk';

// Maps the hundredth place of a status to a color
const colorCodes = {
  5: 'red',
  4: 'yellow',
  3: 'cyan',
  2: 'green',
  1: 'green'
};

// err is optional, only present if there was downstream err
function logResponse(request, response, start, err) {
  const status = err 
    ? (err.status || 500)
    : (response.status || 404);

  const statusColor = colorCodes[Math.floor(status / 100)];
  const upstream = err ? chalk.red('xxx') : chalk.gray('<--');
  console.log(`${upstream} ${chalk.bold(request.method)} ${chalk.gray(request.url)} ${chalk[statusColor](status)} ${chalk.gray(time(start))}`);
}

////////////////////////////////////////////////////////////

// https://github.com/component/humanize-number
function humanize(n, options) {
  options = options || {};
  var d = options.delimiter || ',';
  var s = options.separator || '.';
  n = n.toString().split('.');
  n[0] = n[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + d);
  return n.join(s);
};

function time(start) {
  return humanize(Date.now() - start) + 'ms';
}

////////////////////////////////////////////////////////////

export default function logger() {
  return function middleware(handler) {
    return async function newHandler(request) {
      console.log(`${chalk.gray('-->')} ${chalk.bold(request.method)} ${chalk.gray(request.url)}`);
      const start = Date.now();

      let response;
      try {
        response = await handler(request);
      } catch(err) {
        logResponse(request, response, start, err);
        throw err;
      }
      logResponse(request, response, start);

      return response
    }
  }
}
