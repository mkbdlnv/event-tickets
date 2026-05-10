import cluster from 'node:cluster';
import os from 'node:os';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 4000;

if (cluster.isPrimary) {
  const workers = os.cpus().length;
  for (let index = 0; index < workers; index += 1) {
    cluster.fork();
  }

  cluster.on('exit', () => {
    cluster.fork();
  });
} else {
  const { default: app } = await import('./src/app.js');
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}
