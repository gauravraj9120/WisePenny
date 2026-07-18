const { spawn } = require('child_process');
const path = require('path');

const nodeWinPath = path.join(__dirname, '.node-win');
const env = { ...process.env };
env.PATH = `${nodeWinPath};${env.PATH || ''}`;

console.log('Starting WisePenny Application Servers...');

// Start Backend
console.log('Launching Backend Server (Express)...');
const backend = spawn('node', ['backend/server.js'], {
  cwd: __dirname,
  env,
  shell: true,
  stdio: 'inherit'
});

// Start Frontend
console.log('Launching Frontend Dev Server (Vite)...');
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  env,
  shell: true,
  stdio: 'inherit'
});

backend.on('exit', (code) => {
  console.log(`Backend process exited with code ${code}`);
  frontend.kill();
  process.exit(code || 0);
});

frontend.on('exit', (code) => {
  console.log(`Frontend process exited with code ${code}`);
  backend.kill();
  process.exit(code || 0);
});
