"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const index_1 = __importDefault(require("./config/index"));
const prisma_1 = __importDefault(require("./utils/prisma"));
function bootstrap() {
    return __awaiter(this, void 0, void 0, function* () {
        let server;
        try {
            try {
                yield prisma_1.default.$connect();
                console.log('✅ Successfully connected to PostgreSQL database');
            }
            catch (error) {
                console.error('❌ Failed to connect to PostgreSQL database:', error);
                throw error; // This will be caught by the outer try-catch
            }
            // Start the server
            server = app_1.default.listen(index_1.default.port, () => {
                console.log(`Server running on port ${index_1.default.port} in ${index_1.default.env} mode`);
            });
            // Configure server timeout
            server.timeout = 60000; // 60 seconds
            // Handle unhandled rejections
            process.on('unhandledRejection', (reason, promise) => {
                console.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
                // Consider logging to an external service here
            });
            // Handle uncaught exceptions
            process.on('uncaughtException', (error) => {
                console.error(`Uncaught Exception: ${error.message}`);
                // Consider logging to an external service here
                process.exit(1);
            });
            // Graceful shutdown
            const shutdown = (signal) => __awaiter(this, void 0, void 0, function* () {
                console.log(`Received ${signal}, shutting down gracefully...`);
                try {
                    // Close server
                    if (server) {
                        yield new Promise((resolve, reject) => {
                            server.close(err => {
                                if (err) {
                                    console.error('Error while closing server:', err);
                                    reject(err);
                                }
                                else {
                                    console.log('HTTP server closed.');
                                    resolve();
                                }
                            });
                        });
                    }
                    // Disconnect Prisma client
                    yield prisma_1.default.$disconnect();
                    console.log('Database connection closed.');
                    // Exit process
                    process.exit(0);
                }
                catch (error) {
                    console.error('Error during shutdown:', error);
                    process.exit(1);
                }
            });
            // Register signal handlers
            process.on('SIGINT', () => shutdown('SIGINT'));
            process.on('SIGTERM', () => shutdown('SIGTERM'));
        }
        catch (error) {
            console.error('Failed to start server:', error);
            try {
                yield prisma_1.default.$disconnect();
            }
            catch (prismaError) {
                console.error('Failed to disconnect from database:', prismaError);
            }
            process.exit(1);
        }
    });
}
bootstrap();
