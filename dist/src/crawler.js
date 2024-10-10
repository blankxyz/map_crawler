"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/crawler.ts
const playwright_1 = require("playwright");
const url_1 = require("url");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// 日志函数
function log(message) {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${message}`);
}
// 工具函数：检查URL是否有效
function isValidUrl(url) {
    try {
        new url_1.URL(url);
        return true;
    }
    catch (err) {
        return false;
    }
}
// 工具函数：获取主域名
function getBaseDomain(url) {
    const { hostname } = new url_1.URL(url);
    const parts = hostname.split('.');
    if (parts.length >= 2) {
        return parts.slice(-2).join('.');
    }
    else {
        return hostname;
    }
}
// 工具函数：检查是否为同一主域名或其子域名
function isSameDomain(url, baseDomain) {
    const { hostname } = new url_1.URL(url);
    return hostname.endsWith(baseDomain);
}
// 工具函数：检查URL是否指向图片
function isImageUrl(url) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.tiff', '.ico'];
    return imageExtensions.some((ext) => url.toLowerCase().endsWith(ext));
}
// 工具函数：检查URL是否包含图片相关关键词
function containsImageKeyword(url) {
    const imageKeywords = ['image', 'img', 'photo', 'picture', 'gallery', 'thumb', 'icons', 'logo', 'avatar'];
    const lowerUrl = url.toLowerCase();
    return imageKeywords.some((keyword) => lowerUrl.includes(keyword));
}
// 工具函数：获取目录层级深度
function getDirectoryDepth(url) {
    const { pathname } = new url_1.URL(url);
    const pathParts = pathname.replace(/\/$/, '').split('/').filter(Boolean);
    return pathParts.length;
}
// 工具函数：提取目录URL
function extractDirectory(url, maxDirectoryDepth) {
    const { protocol, hostname, pathname } = new url_1.URL(url);
    if (isImageUrl(url) || containsImageKeyword(url)) {
        return null;
    }
    const depth = getDirectoryDepth(url);
    if (depth > maxDirectoryDepth) {
        return null;
    }
    const pathParts = pathname.replace(/\/$/, '').split('/').filter(Boolean);
    if (pathParts.length === 0) {
        return null;
    }
    const directoryPath = pathParts.slice(0, -1).join('/');
    const directoryUrl = `${protocol}//${hostname}/${directoryPath}`;
    return { directoryUrl, depth };
}
// 工具函数：标准化URL
function normalizeUrl(url) {
    const { protocol, hostname, pathname, search } = new url_1.URL(url);
    const normalizedPathname = pathname.replace(/\/$/, '');
    return `${protocol}//${hostname}${normalizedPathname}${search}`;
}
// 主爬虫函数
async function crawlWebsite(baseUrl) {
    // 爬虫配置参数
    const timeLimit = 900000; // 15分钟，单位：毫秒
    const maxDepth = 5;
    const maxPages = 1000;
    const maxRetries = 3;
    const maxDirectoryDepth = 3;
    const startTime = Date.now();
    const baseDomain = getBaseDomain(baseUrl);
    const directoryInfo = {}; // 以深度为键，存储目录信息
    const failedLinks = {};
    const abandonedLinks = [];
    const visited = new Set();
    const directories = new Set();
    const queue = [];
    let pagesCrawled = 0;
    const initialDepth = getDirectoryDepth(baseUrl);
    const normalizedBaseUrl = normalizeUrl(baseUrl);
    queue.push({ url: normalizedBaseUrl, crawlDepth: 0, dirDepth: initialDepth });
    visited.add(normalizedBaseUrl);
    const browser = await playwright_1.chromium.launch();
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    });
    const page = await context.newPage();
    try {
        while (queue.length > 0 && Date.now() - startTime < timeLimit && pagesCrawled < maxPages) {
            const { url, crawlDepth, dirDepth } = queue.shift();
            if (crawlDepth > maxDepth)
                continue;
            if (dirDepth > maxDirectoryDepth) {
                abandonedLinks.push(url);
                continue;
            }
            log(`正在访问: ${url} (爬取深度: ${crawlDepth}, 目录深度: ${dirDepth})`);
            pagesCrawled += 1;
            let retries = 0;
            let success = false;
            while (retries < maxRetries && !success) {
                try {
                    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
                    await page.waitForTimeout(Math.floor(Math.random() * 2000) + 1000); // 随机等待1-3秒
                    success = true;
                }
                catch (error) {
                    retries += 1;
                    log(`访问 ${url} 时出错: ${error.message} (重试次数: ${retries})`);
                    if (retries >= maxRetries) {
                        log(`超过最大重试次数，放弃访问 ${url}`);
                        failedLinks[url] = '超过最大重试次数';
                        abandonedLinks.push(url);
                    }
                }
            }
            if (!success)
                continue;
            // 提取所有链接，包括 iframe 内的链接
            let links = [];
            const frames = page.frames();
            for (const frame of frames) {
                try {
                    const frameLinks = await frame.$$eval('a[href]', (elements) => elements.map((el) => el.href));
                    links = links.concat(frameLinks);
                }
                catch (error) {
                    log(`提取 frame 中的链接时出错: ${error.message}`);
                }
            }
            for (let link of links) {
                if (!isValidUrl(link))
                    continue;
                link = normalizeUrl(link);
                if (!isSameDomain(link, baseDomain))
                    continue;
                if (isImageUrl(link))
                    continue;
                const linkDirDepth = getDirectoryDepth(link);
                if (linkDirDepth > maxDirectoryDepth) {
                    abandonedLinks.push(link);
                    continue;
                }
                if (visited.has(link))
                    continue;
                visited.add(link);
                const directoryResult = extractDirectory(link, maxDirectoryDepth);
                if (directoryResult && !directories.has(directoryResult.directoryUrl)) {
                    directories.add(directoryResult.directoryUrl);
                    let title = '';
                    try {
                        await page.goto(directoryResult.directoryUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
                        await page.waitForTimeout(Math.floor(Math.random() * 2000) + 1000);
                        title = await page.title();
                    }
                    catch (error) {
                        log(`获取 ${directoryResult.directoryUrl} 标题时出错: ${error.message}`);
                    }
                    if (!directoryInfo[directoryResult.depth]) {
                        directoryInfo[directoryResult.depth] = [];
                    }
                    directoryInfo[directoryResult.depth].push({ url: directoryResult.directoryUrl, title });
                }
                if (linkDirDepth <= maxDirectoryDepth) {
                    queue.unshift({ url: link, crawlDepth: crawlDepth + 1, dirDepth: linkDirDepth });
                }
                else {
                    queue.push({ url: link, crawlDepth: crawlDepth + 1, dirDepth: linkDirDepth });
                }
            }
        }
    }
    catch (error) {
        log(`爬虫运行时发生错误: ${error.message}`);
    }
    finally {
        await browser.close();
        const elapsedTime = (Date.now() - startTime) / 1000;
        log(`爬虫运行时间: ${elapsedTime.toFixed(2)} 秒`);
        log(`爬取的页面数: ${pagesCrawled}`);
        log(`失败的链接数: ${Object.keys(failedLinks).length}`);
        log(`被放弃的链接数: ${abandonedLinks.length}`);
        // 保存结果
        saveResults(directoryInfo, failedLinks, abandonedLinks);
    }
}
// 保存结果的函数
function saveResults(directoryInfo, failedLinks, abandonedLinks) {
    const outputDir = path_1.default.join(__dirname, '..', 'public', 'data');
    if (!fs_1.default.existsSync(outputDir)) {
        fs_1.default.mkdirSync(outputDir, { recursive: true });
    }
    // 保存每个层级的目录信息
    for (const depth in directoryInfo) {
        const directories = directoryInfo[depth];
        const csvData = directories.map((info) => `${info.url},"${info.title.replace(/"/g, '""')}"`).join('\n');
        const csvContent = `url,title\n${csvData}`;
        const filename = `directories_depth_${depth}.csv`;
        fs_1.default.writeFileSync(path_1.default.join(outputDir, filename), csvContent, 'utf8');
        log(`目录深度 ${depth} 的信息已保存到 ${filename}`);
    }
    // 保存失败的链接
    const failedEntries = Object.entries(failedLinks);
    if (failedEntries.length > 0) {
        const failedCsvData = failedEntries.map(([url, reason]) => `${url},${reason}`).join('\n');
        fs_1.default.writeFileSync(path_1.default.join(outputDir, 'failed_links.csv'), `url,reason\n${failedCsvData}`, 'utf8');
        log(`失败的链接信息已保存到 failed_links.csv`);
    }
    // 保存被放弃的链接
    if (abandonedLinks.length > 0) {
        const abandonedCsvData = abandonedLinks.join('\n');
        fs_1.default.writeFileSync(path_1.default.join(outputDir, 'abandoned_links.csv'), `url\n${abandonedCsvData}`, 'utf8');
        log(`被放弃的链接已保存到 abandoned_links.csv`);
    }
}
// 从命令行参数获取 URL
const url = process.argv[2];
if (!url) {
    console.error('Please provide a URL to crawl.');
    process.exit(1);
}
crawlWebsite(url)
    .then(() => {
    console.log('Crawling completed.');
    process.exit(0);
})
    .catch((err) => {
    console.error('Error during crawling:', err);
    process.exit(1);
});
