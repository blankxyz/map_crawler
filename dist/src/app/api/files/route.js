"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
// src/app/api/files/route.ts
const server_1 = require("next/server");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function GET() {
    const directoryPath = path_1.default.join(process.cwd(), 'public', 'data');
    try {
        const files = fs_1.default.readdirSync(directoryPath);
        const csvFiles = files.filter((file) => file.endsWith('.csv'));
        return server_1.NextResponse.json({ files: csvFiles });
    }
    catch (err) {
        console.error(err);
        return server_1.NextResponse.json({ message: 'Unable to scan files.' }, { status: 500 });
    }
}
