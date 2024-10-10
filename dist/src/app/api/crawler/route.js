"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
// src/app/api/crawler/route.ts
const server_1 = require("next/server");
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
let crawlerProcess = null;
async function GET(request) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const url = searchParams.get('url');
    if (action === 'start') {
        if (crawlerProcess) {
            return server_1.NextResponse.json({ message: 'Crawler is already running.' }, { status: 400 });
        }
        if (!url) {
            return server_1.NextResponse.json({ message: 'URL is required to start the crawler.' }, { status: 400 });
        }
        // 确定爬虫脚本的路径
        const crawlerScriptPath = path_1.default.join(process.cwd(), 'dist', 'crawler', 'crawler.js');
        // 启动爬虫进程
        crawlerProcess = (0, child_process_1.spawn)('node', [crawlerScriptPath, url]);
        crawlerProcess.stdout.on('data', (data) => {
            console.log(`Crawler stdout: ${data.toString()}`);
        });
        crawlerProcess.stderr.on('data', (data) => {
            console.error(`Crawler stderr: ${data.toString()}`);
        });
        crawlerProcess.on('close', (code) => {
            console.log(`Crawler exited with code ${code}`);
            crawlerProcess = null;
        });
        return server_1.NextResponse.json({ message: 'Crawler started.' });
    }
    else if (action === 'stop') {
        if (crawlerProcess) {
            crawlerProcess.kill('SIGINT');
            crawlerProcess = null;
            return server_1.NextResponse.json({ message: 'Crawler stopped.' });
        }
        else {
            return server_1.NextResponse.json({ message: 'Crawler is not running.' }, { status: 400 });
        }
    }
    else {
        return server_1.NextResponse.json({ message: 'Invalid action.' }, { status: 400 });
    }
}
