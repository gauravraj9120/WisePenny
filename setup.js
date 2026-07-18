const { execSync } = require('child_process');
const path = require('path');

const nodeWinPath = path.join(__dirname, '.node-win');
const env = { ...process.env };
env.PATH = `${nodeWinPath};${env.PATH || ''}`;

console.log('Starting setup: installing dependencies...');

try {
  console.log('--- Installing Backend Dependencies ---');
  execSync('npm install', {
    cwd: path.join(__dirname, 'backend'),
    env,
    stdio: 'inherit',
    shell: true
  });

  console.log('--- Installing Frontend Dependencies ---');
  execSync('npm install', {
    cwd: path.join(__dirname, 'frontend'),
    env,
    stdio: 'inherit',
    shell: true
  });

  console.log('Setup completed successfully!');
} catch (error) {
  console.error('Setup failed:', error.message);
  process.exit(1);
}
