"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTransactionFee = exports.WALLET_CONFIG = void 0;
exports.WALLET_CONFIG = {
    bKash: {
        minWithdrawAmount: 50,
        smallAmountThreshold: 1000,
        smallAmountFee: 5,
        largeAmountFee: 10,
    },
    Nagad: {
        minWithdrawAmount: 50,
        smallAmountThreshold: 1000,
        smallAmountFee: 5,
        largeAmountFee: 10,
        largeAmountFeePerThousand: 5, // 5 TK per 1000 TK
    },
};
const calculateTransactionFee = ({ walletName, walletPhoneNo, amount, }) => {
    const config = exports.WALLET_CONFIG[walletName];
    // Validate minimum amount
    if (amount < config.minWithdrawAmount) {
        throw new Error(`নূন্যতম উত্তোলনের পরিমাণ ${config.minWithdrawAmount} টাকা`);
    }
    let transactionFee = 0;
    // if (amount <= config.smallAmountThreshold) {
    //   transactionFee = config.smallAmountFee
    // } else if (walletName === 'bKash' && amount > config.smallAmountThreshold) {
    //   // For bKash, calculate 10 TK for amounts over 1000
    //   transactionFee = config.largeAmountFee
    // } else if (walletName === 'Nagad' && amount > config.smallAmountThreshold) {
    //   // For Nagad, calculate 5 TK for amounts over 1000
    //   transactionFee =
    //     Math.floor(amount / 1000) * config.largeAmountFeePerThousand!
    // } else {
    //   throw new Error('Invalid amount')
    // }
    const actualAmount = amount - transactionFee;
    return {
        amount,
        actualAmount,
        transactionFee,
    };
};
exports.calculateTransactionFee = calculateTransactionFee;
