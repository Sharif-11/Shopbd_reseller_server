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
const prisma_1 = __importDefault(require("../../utils/prisma"));
class PaymentService {
    checkExistingTransactionId(transactionId_1) {
        return __awaiter(this, arguments, void 0, function* (transactionId, tx = undefined) {
            const existingTransaction = yield (tx || prisma_1.default).payment.findUnique({
                where: { transactionId },
            });
            if (existingTransaction) {
                throw new Error('Transaction ID already exists');
            }
            return existingTransaction;
        });
    }
    createWithdrawPayment(_a) {
        return __awaiter(this, arguments, void 0, function* ({ userName, userPhoneNo, amount, transactionFee, systemWalletPhoneNo, systemWalletName, transactionId, userWalletName, userWalletPhoneNo, tx, }) {
            yield this.checkExistingTransactionId(transactionId, tx);
            const payment = yield (tx || prisma_1.default).payment.create({
                data: {
                    userName,
                    userPhoneNo,
                    amount,
                    transactionFee,
                    systemWalletPhoneNo,
                    systemWalletName,
                    transactionId,
                    paymentType: 'WITHDRAWAL_PAYMENT',
                    paymentStatus: 'COMPLETED',
                    processedAt: new Date(),
                    actualAmount: amount - transactionFee,
                    sender: 'SYSTEM',
                    userWalletName,
                    userWalletPhoneNo,
                },
            });
            return payment;
        });
    }
}
exports.default = new PaymentService();
