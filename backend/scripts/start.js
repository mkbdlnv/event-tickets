import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';

if (process.platform !== 'win32') {
  await import('../cluster.js');
} else {
  const windowsPath = process.cwd().replaceAll('\\', '/');
  const converted = spawnSync('wsl', ['wslpath', '-a', windowsPath], {
    encoding: 'utf8'
  });

  if (converted.status !== 0) {
    console.error(converted.stderr || 'Unable to convert project path for WSL.');
    process.exit(converted.status || 1);
  }

  const wslCwd = converted.stdout.trim();
  const command = 'if [ -s "$HOME/.nvm/nvm.sh" ]; then . "$HOME/.nvm/nvm.sh"; fi; npm run start:wsl';
  const child = spawn('wsl', ['--cd', wslCwd, 'bash', '-lc', command], {
    stdio: 'inherit'
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code || 0);
    }
  });
}
