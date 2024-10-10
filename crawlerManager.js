// crawlerManager.js
const { spawn } = require('child_process');
const path = require('path');

let crawlerProcess = null;
let io = null;

function setSocketIo(socketIo) {
  io = socketIo;
}

function startCrawler(url) {
  if (crawlerProcess) {
    return { success: false, message: 'Crawler is already running.' };
  }
  if (!url) {
    return { success: false, message: 'URL is required to start the crawler.' };
  }

  const crawlerScriptPath = path.join(process.cwd(), 'dist', 'crawler', 'crawler.js');

  crawlerProcess = spawn('node', [crawlerScriptPath, url]);

  crawlerProcess.stdout.on('data', (data) => {
    const message = data.toString();
    console.log(`Crawler stdout: ${message}`);
    if (io) {
      io.emit('crawler_log', message);
    }
  });

  crawlerProcess.stderr.on('data', (data) => {
    const message = data.toString();
    console.error(`Crawler stderr: ${message}`);
    if (io) {
      io.emit('crawler_log', message);
    }
  });

  crawlerProcess.on('close', (code) => {
    console.log(`Crawler exited with code ${code}`);
    if (io) {
      io.emit('crawler_status', 'stopped');
    }
    crawlerProcess = null;
  });

  if (io) {
    io.emit('crawler_status', 'running');
  }

  return { success: true, message: 'Crawler started.' };
}

function stopCrawler() {
  if (crawlerProcess) {
    crawlerProcess.kill('SIGINT');
    crawlerProcess = null;
    if (io) {
      io.emit('crawler_status', 'stopped');
    }
    return { success: true, message: 'Crawler stopped.' };
  } else {
    return { success: false, message: 'Crawler is not running.' };
  }
}

module.exports = {
  setSocketIo,
  startCrawler,
  stopCrawler,
};
