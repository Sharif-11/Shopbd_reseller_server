"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_json_1 = __importDefault(require("../src/swagger.json"));
const config_1 = __importDefault(require("./config"));
const globalErrorHandler_1 = __importDefault(require("./middlewares/globalErrorHandler"));
const trim_middlewares_1 = __importDefault(require("./middlewares/trim.middlewares"));
const global_routes_1 = __importDefault(require("./routes/global.routes"));
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   standardHeaders: true,
//   legacyHeaders: false,
// })
// app.use(limiter)
// Body parsing middleware
app.use(express_1.default.json({ limit: '10kb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10kb' }));
app.use((0, cookie_parser_1.default)());
app.use(trim_middlewares_1.default);
// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        // Development environment - allow all origins
        if (config_1.default.env === 'development') {
            return callback(null, true);
        }
        // Production environment - allow only specific origins
        const allowedOrigins = [
            'https://admin.shopbdresellerjobs.shop',
            'https://shopbdresellerjobs.shop',
            'https://shopbdresellerjob.com',
            'https://admin.shopbdresellerjob.com',
        ];
        // Allow all subdomains of shopbdresellerjobs.shop
        if (origin === null || origin === void 0 ? void 0 : origin.endsWith('.shopbdresellerjobs.shop')) {
            return callback(null, true);
        }
        if (origin === null || origin === void 0 ? void 0 : origin.endsWith('.shopbdresellerjob.com')) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        // Origin not allowed
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use((0, cors_1.default)(corsOptions));
const options = {
    customCss: '.swagger-ui .topbar { display: none }',
};
// Swagger UI
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_json_1.default, options));
// Routes
app.use('/api/v1', global_routes_1.default);
// app.get('/', async (req, res) => {
//    const result= await prisma.user.findMany({
//       where: {
//         isVerified: true,
//         referralCode: null,
//       },
//       select: {
//         userId: true,
//       },
//    })
//    const referralCodes: Record<string, string> = {}
//    const uniqueCodes = new Set<string>()
//     for (const user of result) {
//       let referralCode = generateRandomCode(8)
//       while (1) {
//         referralCode = generateRandomCode(8)
//         if (!referralCodes[user.userId as string] && !uniqueCodes.has(referralCode)) {
//           referralCodes[user.userId as string] = referralCode
//           uniqueCodes.add(referralCode)
//           break
//         }
//       }
//     }
//     const updatePromises = result.map(user =>
//       prisma.user.update({
//         where: { userId: user.userId },
//         data: { referralCode: referralCodes[user.userId as string] },
//       })
//     )
//     const results = await Promise.all(updatePromises)
//    res.status(200).json({
//       statusCode: 200,
//       success: true,
//       message: 'Referral codes generated successfully',
//       data: results,
//    })
// })
// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        statusCode: 200,
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});
app.get('/', (req, res) => {
    res.status(200).json({
        statusCode: 200,
        success: true,
        message: 'Server is running on port ' + config_1.default.port,
        timestamp: new Date().toISOString(),
    });
});
// Handle 404
app.all('*', (req, res) => {
    console.log('Server Hit');
    res.status(404).json({
        statusCode: 404,
        success: false,
        message: `Can't find ${req.originalUrl} on this server!`,
    });
});
// Global error handler
app.use(globalErrorHandler_1.default);
exports.default = app;
