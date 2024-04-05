const wallet = require('../models/dbv2/tokens_universal');

async function getWallet(i, userId){
    let userWallet = await wallet.findOne({ userID: userId });

        if (!userWallet) {
            userWallet = new wallet({
                userID: userId,
                tokens: 0,
                transactions: 
                    {date: i.createdAt,
                    identifier: 'Init',
                    desc: "Initialized Wallet",
                    amount: 0}
            });
            await userWallet.save();
        }
    
    return userWallet;z
}
module.exports = getWallet;
