/**
 * VELOX-BOT ULTIMATE (多指令适配版)
 * 支持 /draw, /img, /pic 画图
 * 修复了 Gemini 拒接画画的问题
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/init") {
      await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/setWebhook?url=${url.origin}`);
      return new Response("Webhook OK");
    }

    if (request.method === "POST") {
      let chatId = null;
      try {
        const payload = await request.json();
        if (!payload.message) return new Response("OK");

        chatId = payload.message.chat.id;
        const userId = payload.message.from.id;
        const msgText = payload.message.text || payload.message.caption || "";

        // 鉴权 (如果有设置)
        if (env.ALLOWED_ID && String(userId).trim() !== String(env.ALLOWED_ID).trim()) {
           return new Response("Forbidden");
        }

        // ==========================================================
        // 🎨 画画模块 (升级：支持 /img, /pic, /draw)
        // ==========================================================
        // 正则匹配：只要是以 /draw, /img, /pic 开头都算画画
        const drawMatch = msgText.match(/^\/(draw|img|pic) (.+)/);
        
        if (drawMatch) {
            const prompt = drawMatch[2]; // 提取后面的提示词
            await sendChatAction(chatId, "upload_photo", env.TG_TOKEN);
            try {
                if (!env.AI) throw new Error("后台没绑定 AI 变量");
                const imageStream = await env.AI.run("@cf/bytedance/stable-diffusion-xl-lightning", { prompt: prompt });
                await sendTelegramPhoto(chatId, imageStream, env.TG_TOKEN);
            } catch (e) {
                await sendMessage(chatId, `❌ 画画失败: ${e.message}`, env.TG_TOKEN);
            }
            return new Response("OK");
        }

        // ==========================================================
        // 🧠 对话模块 (3.0 优先 -> 2.0 兜底)
        // ==========================================================
        await sendChatAction(chatId, "typing", env.TG_TOKEN);

        let history = [];
        try { if (env.DB) history = await env.DB.get(chatId, { type: "json" }) || []; } catch(e){}

        let userParts = [];
        if (payload.message.photo) {
            const photo = payload.message.photo[payload.message.photo.length - 1];
            const b64 = await getTgImageAsBase64(photo.file_id, env.TG_TOKEN);
            if (b64) userParts.push({ inline_data: { mime_type: "image/jpeg", data: b64 } });
        }
        if (msgText) userParts.push({ text: msgText });
        else if (userParts.length === 0) return new Response("OK");
        else userParts.push({ text: "描述图片" });

        const contents = [...history, { role: "user", parts: userParts }];

        let aiReply = "";
        try {
            // 优先尝试 3.0
            aiReply = await callGemini(env.GEMINI_KEY, "gemini-3-flash-preview", contents);
        } catch (err3) {
            console.error("3.0 Error:", err3);
            try {
                // 3.0 挂了/限流，自动切 2.0
                aiReply = await callGemini(env.GEMINI_KEY, "gemini-2.0-flash-exp", contents);
                aiReply = `(⚙️ 3.0繁忙，已切2.0)\n${aiReply}`;
            } catch (err2) {
                // 如果是配额不足，明确提示
                if (err2.message.includes("429")) {
                    await sendMessage(chatId, "📉 **今日免费额度已用完**\nGoogle 限制了您的调用次数。请明天再试，或再去建个新项目换Key。", env.TG_TOKEN);
                    return new Response("OK");
                }
                throw err2;
            }
        }

        await sendMessage(chatId, aiReply, env.TG_TOKEN);

        try {
            if (env.DB) {
                history.push({ role: "user", parts: userParts });
                history.push({ role: "model", parts: [{ text: aiReply }] });
                if (history.length > 20) history = history.slice(history.length - 20);
                ctx.waitUntil(env.DB.put(chatId, JSON.stringify(history), { expirationTtl: 86400 }));
            }
        } catch(e){}

      } catch (err) {
        if (chatId) await sendMessage(chatId, `⚠️ 错误: ${err.message}`, env.TG_TOKEN);
      }
      return new Response("OK");
    }
    return new Response("Velo-Bot Ready");
  }
};

async function callGemini(apiKey, model, contents) {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: contents })
    });
    const data = await resp.json();
    if (data.error) throw new Error(`${data.error.code} ${data.error.message}`);
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
}

async function sendMessage(chatId, text, token) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: "Markdown" })
  });
}
async function sendChatAction(chatId, action, token) {
  await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: action })
  });
}
async function sendTelegramPhoto(chatId, imageStream, token) {
    const blob = await new Response(imageStream).blob();
    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("photo", blob, "img.png");
    await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: "POST", body: formData });
}
async function getTgImageAsBase64(fileId, token) {
    try {
        const pathRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
        const pathData = await pathRes.json();
        const res = await fetch(`https://api.telegram.org/file/bot${token}/${pathData.result.file_path}`);
        const buf = await res.arrayBuffer();
        return btoa(String.fromCharCode(...new Uint8Array(buf)));
    } catch (e) { return null; }
}
