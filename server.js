// server.js
const { createServer } = require('http');
const next = require('next');
const express = require('express');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs'); // 确保导入 fs 模块

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const crawlerManager = require('./crawlerManager');

app.prepare().then(() => {
  const server = express();

  const httpServer = createServer(server);
  const io = socketIo(httpServer);

  // 将 io 对象传递给 crawlerManager，以便在爬虫中使用
  crawlerManager.setSocketIo(io);

  // 添加 API 路由
  server.get('/api/crawler', (req, res) => {
    const action = req.query.action;
    const url = req.query.url;

    if (action === 'start') {
      const result = crawlerManager.startCrawler(url);
      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ message: result.message });
      }
    } else if (action === 'stop') {
      const result = crawlerManager.stopCrawler();
      if (result.success) {
        res.json({ message: result.message });
      } else {
        res.status(400).json({ message: result.message });
      }
    } else {
      res.status(400).json({ message: 'Invalid action.' });
    }
  });

  server.get('/api/files', (req, res) => {
    const directoryPath = path.join(process.cwd(), 'dist/public', 'data');

    try {
      const files = fs.readdirSync(directoryPath);
      const csvFiles = files.filter((file) => file.endsWith('.csv'));
      res.json({ files: csvFiles });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Unable to scan files.' });
    }
  });

  // 静态文件服务
  server.use('/data', express.static(path.join(process.cwd(), 'dist/public', 'data')));

  // 处理 Next.js 的页面请求
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  io.on('connection', (socket) => {
    console.log('A client connected');
    socket.on('disconnect', () => {
      console.log('A client disconnected');
    });
  });

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
