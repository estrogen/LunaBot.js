const { google } = require('googleapis');
module.exports = (bot) => {
    bot.hGoogle = async () => {
        const client = new google.auth.JWT(
            process.env.email,
            null,
            process.env.key.replace(/\\n/g, '\n'),
            ['https://www.googleapis.com/auth/spreadsheets']
        );

        const gsapi = google.sheets({ version: 'v4', auth: client });
        bot.gsapi = gsapi;
    };
};
