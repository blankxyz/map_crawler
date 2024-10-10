// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  TextField,
  Button,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
} from '@mui/material';

import io from 'socket.io-client';

// export default function Home() {
//   // ... 省略前面的代码

//   useEffect(() => {
//     fetchFiles();

//     const socket = io();

//     socket.on('connect', () => {
//       console.log('Connected to server');
//     });

//     socket.on('crawler_log', (message: string) => {
//       setLogs((prevLogs) => [...prevLogs, message]);
//     });

//     socket.on('crawler_status', (status: 'running' | 'stopped') => {
//       setCrawlerStatus(status);
//       if (status === 'stopped') {
//         fetchFiles();
//       }
//     });

//     return () => {
//       socket.disconnect();
//     };
//   }, []);

export default function Home() {
  const [url, setUrl] = useState<string>('');
  const [crawlerStatus, setCrawlerStatus] = useState<'running' | 'stopped'>('stopped');
  const [files, setFiles] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const startCrawler = async () => {
    const res = await fetch(`/api/crawler?action=start&url=${encodeURIComponent(url)}`);
    const data = await res.json();
    if (res.ok) {
      setCrawlerStatus('running');
      setLogs([]);
    } else {
      alert(data.message);
    }
  };

  const stopCrawler = async () => {
    const res = await fetch('/api/crawler?action=stop');
    const data = await res.json();
    if (res.ok) {
      setCrawlerStatus('stopped');
    } else {
      alert(data.message);
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/files');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data.files)) {
        setFiles(data.files);
      } else {
        setFiles([]);
      }
    } catch (error) {
      console.error('获取文件列表时出错:', error);
      setFiles([]);
    }
  };

  useEffect(() => {
    fetchFiles();


    const socket = io();

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('crawler_log', (message: string) => {
      setLogs((prevLogs) => [...prevLogs, message]);
    });

    socket.on('crawler_status', (status: 'running' | 'stopped') => {
      setCrawlerStatus(status);
      if (status === 'stopped') {
        fetchFiles();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);
  // }, [crawlerStatus]);

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">爬虫控制面板</Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ marginTop: 4 }}>
        <Paper elevation={3} sx={{ padding: 2 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <TextField
              label="请输入 URL"
              variant="outlined"
              fullWidth
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={crawlerStatus === 'running'}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={startCrawler}
              disabled={crawlerStatus === 'running' || !url}
              sx={{ marginLeft: 2 }}
            >
              启动爬虫
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={stopCrawler}
              disabled={crawlerStatus === 'stopped'}
              sx={{ marginLeft: 2 }}
            >
              中止爬虫
            </Button>
          </Box>
          {crawlerStatus === 'running' && (
            <Box display="flex" alignItems="center" mb={2}>
              <CircularProgress size={24} sx={{ marginRight: 1 }} />
              <Typography variant="body1">爬虫正在运行...</Typography>
            </Box>
          )}
          <Typography variant="h6">爬虫日志</Typography>
          <Paper variant="outlined" sx={{ height: 200, overflowY: 'scroll', padding: 1, backgroundColor: '#f5f5f5' }}>
            {logs.map((log, index) => (
              <Typography key={index} variant="body2">
                {log}
              </Typography>
            ))}
          </Paper>
          <Typography variant="h6" mt={2}>
            生成的 CSV 文件
          </Typography>
          <Button variant="outlined" onClick={fetchFiles} sx={{ marginBottom: 1 }}>
            刷新文件列表
          </Button>
          <List>
            {files.map((file) => (
              <ListItem key={file} divider>
                <ListItemText
                  primary={
                    <a href={`/data/${file}`} target="_blank" rel="noopener noreferrer">
                      {file}
                    </a>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Container>
    </>
  );
}
