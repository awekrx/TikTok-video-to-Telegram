process.env.NTBA_FIX_319 = "1";
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const axios = require("axios");
const TikTokScraper = require("tiktok-scraper");

const app = express();
const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

async function getLongURL(src) {
    let data = (await axios.post(`https://checkshorturl.com/expand.php?u=${src}`)).data;
    data = data.slice(data.indexOf("p=site:") + "p=site:".length);
    data = data.slice(0, data.indexOf("?"));
    return data;
}

app.get("*", (req, res) => {
    res.send({ success: true });
});

app.listen(process.env.PORT || 779);

bot.on("message", async (message) => {
    if (message.text) {
        try {
            if (message.text.startsWith("https://vm.tiktok.com/" || "https://www.tiktok.com/")) {
                let url;
                if (message.text.startsWith("https://vm.tiktok.com/")) {
                    url = await getLongURL(message.text);
                } else {
                    url = message.text;
                }
                let video = (await TikTokScraper.getVideoMeta(url)).collector[0].videoUrl;
                bot.sendVideo(message.chat.id, video);
            } else {
                bot.sendMessage(
                    message.chat.id,
                    "<b>Send link on <a href='https://www.tiktok.com/'>TikTok</a> video</b>",
                    {
                        parse_mode: "HTML",
                    },
                );
            }
        } catch {
            bot.sendMessage(message.chat.id, "<b>Send link on <a href='https://www.tiktok.com/'>TikTok</a> video</b>", {
                parse_mode: "HTML",
            });
        }
    } else {
        bot.sendMessage(message.chat.id, "<b>Send link on <a href='https://www.tiktok.com/'>TikTok</a> video</b>", {
            parse_mode: "HTML",
        });
    }
});

bot.on("inline_query", async (query) => {
    if (query.query.startsWith("https://vm.tiktok.com/" || "https://www.tiktok.com/")) {
        try {
            let url;
            if (query.query.startsWith("https://vm.tiktok.com/")) {
                url = await getLongURL(query.query);
            } else {
                url = query.query;
            }
            let res = (await TikTokScraper.getVideoMeta(url)).collector[0];
            let video = res.videoUrl;
            let image = res.imageUrl;
            bot.answerInlineQuery(query.id, [
                {
                    id: 0,
                    mime_type: "video/mp4",
                    type: "video",
                    title: "Video",
                    description: `${url}`,
                    hide_url: true,
                    video_url: `${video}`,
                    thumb_url: `${image}`,
                },
            ]);
        } catch {
            bot.answerInlineQuery(query.id, [
                {
                    id: 0,
                    type: "article",
                    title: "Video not found",
                    description: "Send link on TikTok video",
                    message_text: "Video not found :(\nSend link on TikTok video",
                },
            ]);
        }
    } else {
        bot.answerInlineQuery(query.id, [
            {
                id: 0,
                type: "article",
                title: "Video not found",
                description: "Send link on TikTok video",
                message_text: "Video not found :(\nSend link on TikTok video",
            },
        ]);
    }
});

setInterval(() => {
    axios.get(`${process.env.HOSTING}`, 10 * 60_000);
});
