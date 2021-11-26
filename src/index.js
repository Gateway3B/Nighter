const { Client, MessageEmbed} = require('discord.js');
const client = new Client();

const { discordBotToken, PrimaryColor} = require('../config.json');

// Scraper consts
const rp = require('request-promise');
const cheerio = require('cheerio');
const url = 'https://www.timeanddate.com/moon/phases/';


// Connects to MongoDB Atlas with mongoose and registers commands on connection with discord.
client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    await client.guilds.cache.each(async guild => guild.members.fetch());

    setupGoodNight();

});


async function setupGoodNight()
{
    var hour = 9 + 12;
    var minute = 00;
    var now = Date.now();
    var goodNight = new Date(now);
    goodNight.setHours(hour, minute);
    if(goodNight - now < 0)
    {
        goodNight.setDate(goodNight.getDate() + 1);
    }
    
    setTimeout(function(){sayGoodNight()}, goodNight - now);
}


async function sayGoodNight()
{
    let moonPhase = await getMoonPhase();

    let onlineMembers = await getOnlineMembers();

    onlineMembers.forEach((members, guild) => {
        guild.channels.cache.find((channel) => channel.name.toLowerCase() === 'general')
            .send(
                new MessageEmbed()
                    .setColor(PrimaryColor)
                    .setTitle("Good Night!")
                    .setDescription(`${members}`)
                    .setImage(`https://www.timeanddate.com/${moonPhase[0]}`)
                    .setFooter(moonPhase[1])
            );
    });

    setTimeout(function(){setupGoodNight()}, 60000);
}

async function getMoonPhase()
{
    var curMoonImage;
    var curMoonPhase;

    await rp(url)
        .then((html) => {
            const $ = cheerio.load(html);
            curMoonImage = $('#cur-moon').attr('src');
            curMoonPhase = $('#qlook > a')[0].children[0].data;
        });

    return [curMoonImage, curMoonPhase];
}

async function getOnlineMembers()
{
    let onlineMembers = new Map();
    // await client.guilds.fetch();
    client.guilds.cache.each(async guild => 
    {
        let members = '';
        guild.members.cache.each(member => {
            if((member.presence.status === 'online' 
                || member.presence.status === 'dnd')
                && !member.roles.cache.has(guild.roles.cache.find(role => role.name === "Surf's Up Dude").id)
                && !member.user.bot)
            {
                members += `<@${member.id}>, `;
            }
        });
        if(members.length > 0)
            onlineMembers.set(guild, members.substring(0, members.length-2));
    });

    return onlineMembers;
}

client.login(discordBotToken);

process.on('SIGINT', async () => {
    console.log('Bot Shutdown');
    await client.destroy();
    process.exit(1);
});
