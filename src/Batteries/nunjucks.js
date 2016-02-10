
import nunjucks from 'nunjucks';

function configure(path, opts = {}) {
  const env = nunjucks.configure(path, opts);
  const ext = opts.ext || '';

  const filters = opts.filters || {};
  for (let f in filters) {
    env.addFilter(f, filters[f]);
  }

  const globals = opts.globals || {};
  for (let g in globals) {
    env.addGlobal(g, globals[g]);
  }

  return async function render(template, context) {
    return new Promise((resolve, reject) => {
      nunjucks.render(template + ext, context, (err, html) => {
        if (err) return reject(err);
        resolve(html);
      });
    });
  }
}

export default configure;
