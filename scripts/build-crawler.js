// scripts/build-crawler.js
const { exec } = require('child_process');
const path = require('path');

const tscPath = path.join('node_modules', '.bin', 'tsc');
const tsConfigPath = path.join('tsconfig.crawler.json');

// Handle platform differences (Windows vs. Unix)
const isWin = process.platform === 'win32';
const tscCommand = isWin ? `${tscPath}.cmd` : tscPath;

exec(`${tscCommand} --project ${tsConfigPath}`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error compiling crawler script: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Compilation stderr: ${stderr}`);
    return;
  }
  console.log('Crawler script compiled successfully.');
});
