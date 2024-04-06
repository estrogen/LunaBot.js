const wallet = require('../models/dbv2/tokens_universal');

async function rankingSearch(userWallet) {
    const sortedWallets = await wallet.find({}).sort({ tokens: -1 });

    
    let left = 0;
    let right = sortedWallets.length - 1;

    while (left <= right) {
        let mid = Math.floor((left + right) / 2);
        if (sortedWallets[mid].tokens === userWallet.tokens && sortedWallets[mid].userID === userWallet.userID) {
            return mid + 1; // Found the wallet with the target token value and ID
        } else if (sortedWallets[mid].tokens > userWallet.tokens || (sortedWallets[mid].tokens == userWallet.tokens && sortedWallets[mid]._id < userWallet._id)) {
            left = mid + 1; // Search in the right half
        } else {
            right = mid - 1; // Search in the left half
        }
    }

    return -1; // Wallet with the target token value not found
}

module.exports = rankingSearch;