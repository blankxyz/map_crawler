"use strict";
// src/app/page.tsx
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Home;
const react_1 = require("react");
function Home() {
    const [url, setUrl] = (0, react_1.useState)('');
    const [crawlerStatus, setCrawlerStatus] = (0, react_1.useState)('stopped');
    const [files, setFiles] = (0, react_1.useState)([]);
    const startCrawler = async () => {
        const res = await fetch(`/api/crawler?action=start&url=${encodeURIComponent(url)}`);
        const data = await res.json();
        alert(data.message);
        if (res.ok) {
            setCrawlerStatus('running');
        }
    };
    const stopCrawler = async () => {
        const res = await fetch('/api/crawler?action=stop');
        const data = await res.json();
        alert(data.message);
        if (res.ok) {
            setCrawlerStatus('stopped');
        }
    };
    const fetchFiles = async () => {
        const res = await fetch('/api/files');
        const data = await res.json();
        setFiles(data.files);
    };
    (0, react_1.useEffect)(() => {
        fetchFiles();
    }, [crawlerStatus]);
    return (<div style={{ padding: '20px' }}>
      <h1>爬虫控制面板</h1>
      <div>
        <input type="text" placeholder="请输入 URL" value={url} onChange={(e) => setUrl(e.target.value)} style={{ width: '300px', marginRight: '10px' }}/>
        <button onClick={startCrawler} disabled={crawlerStatus === 'running'}>
          启动爬虫
        </button>
        <button onClick={stopCrawler} disabled={crawlerStatus === 'stopped'}>
          中止爬虫
        </button>
      </div>
      <h2>生成的 CSV 文件</h2>
      <button onClick={fetchFiles}>刷新文件列表</button>
      <ul>
        {files.map((file) => (<li key={file}>
            <a href={`/data/${file}`} target="_blank" rel="noopener noreferrer">
              {file}
            </a>
          </li>))}
      </ul>
    </div>);
}
