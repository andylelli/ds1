var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
import { createInterface } from 'readline';
import { MCP_MESSAGE_TYPES } from './protocol.js';
export class MCPServer {
    constructor() {
        this.tools = new Map();
        this.resources = new Map();
    }
    registerTool(name, handler) {
        this.tools.set(name, handler);
    }
    registerResource(uri, handler) {
        this.resources.set(uri, handler);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_1, _b, _c;
            const rl = createInterface({
                input: process.stdin,
                output: process.stdout,
                terminal: false,
            });
            process.stderr.write(`[MCP Server] Started. Listening on stdio...\n`);
            try {
                for (var _d = true, rl_1 = __asyncValues(rl), rl_1_1; rl_1_1 = yield rl_1.next(), _a = rl_1_1.done, !_a; _d = true) {
                    _c = rl_1_1.value;
                    _d = false;
                    const line = _c;
                    if (!line.trim())
                        continue;
                    try {
                        const message = JSON.parse(line);
                        yield this.handleMessage(message);
                    }
                    catch (error) {
                        this.sendError(null, -32700, 'Parse error');
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = rl_1.return)) yield _b.call(rl_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        });
    }
    handleMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            // Basic routing
            if (message.method === MCP_MESSAGE_TYPES.TOOL_CALL) {
                yield this.handleToolCall(message);
            }
            else if (message.method === MCP_MESSAGE_TYPES.RESOURCE_READ) {
                yield this.handleResourceRead(message);
            }
            else {
                // Unknown method
                // In a real server we might return method not found, but here we just ignore or log
            }
        });
    }
    handleToolCall(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, arguments: args } = message.params;
            const handler = this.tools.get(name);
            if (handler) {
                try {
                    const result = yield handler(args);
                    this.sendResult(message.id, result);
                }
                catch (e) {
                    this.sendError(message.id, -32603, e.message);
                }
            }
            else {
                this.sendError(message.id, -32601, `Tool ${name} not found`);
            }
        });
    }
    handleResourceRead(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const { uri } = message.params;
            const handler = this.resources.get(uri);
            if (handler) {
                try {
                    const result = yield handler(uri);
                    this.sendResult(message.id, result);
                }
                catch (e) {
                    this.sendError(message.id, -32603, e.message);
                }
            }
            else {
                this.sendError(message.id, -32601, `Resource ${uri} not found`);
            }
        });
    }
    sendResult(id, result) {
        if (id === undefined || id === null)
            return;
        const response = {
            jsonrpc: '2.0',
            id,
            result
        };
        console.log(JSON.stringify(response));
    }
    sendError(id, code, message) {
        if (id === undefined || id === null)
            return;
        const response = {
            jsonrpc: '2.0',
            id,
            error: {
                code,
                message
            }
        };
        console.log(JSON.stringify(response));
    }
}
