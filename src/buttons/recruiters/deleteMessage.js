const cc = require('../../../config.json');
const permission = require('../../functions/funcPermissions.js');


module.exports = {
    data: {
        name: 'deleteMessage'
    },
    async execute(i, bot) {
        if (!permission(i.member, "Recruiter",))
            return await i.reply({ content: "You lack the permissions", ephemeral: true });


        i.message.delete();
        await i.reply({ content: "Deleted!", ephemeral: true });
    },
}