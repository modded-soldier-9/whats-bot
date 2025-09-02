# 🚀 Quick Start Guide

Get your WhatsApp AI Bot running in 5 minutes!

## ⚡ Super Quick Setup

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/whatsai-bot.git
cd whatsai-bot
npm install
```

### 2. Get Your API Key
1. Go to [Google AI Studio](https://ai.google.dev/)
2. Create a new API key
3. Copy the key

### 3. Run Setup
```bash
npm run setup
```
Follow the prompts to configure your bot.

### 4. Start the Bot
```bash
npm start
```

### 5. Connect WhatsApp
1. Scan the QR code with your WhatsApp
2. Start chatting with your bot!

## 🎭 Try Different Personalities

After setup, you can change personalities by editing `.env`:

```env
BOT_PERSONALITY=friendly    # or professional, casual, humorous, neutral
```

## 📱 Test Commands

Send these commands to your bot:

- `/help` - See all commands
- `/status` - Check bot status
- `/personalities` - List available personalities
- `/info` - Show configuration

## 🔧 Common Issues

### "GEMINI_API_KEY is required"
- Make sure `.env` file exists
- Check your API key is correct

### "Bot not responding"
- Try `/start` command
- Check if you're messaging the bot directly (not in a group)

### "QR code not showing"
- Make sure `QR_CODE_DISPLAY=true` in `.env`
- Check terminal output

## 🎯 Next Steps

- **Customize**: Edit personality files in `personalities/` folder
- **Configure**: Modify settings in `.env` file
- **Monitor**: Check logs in `logs/` folder
- **Extend**: Add new commands in `src/handlers/commandHandler.js`

## 📚 Need Help?

- 📖 Read the full [README.md](README.md)
- 🐛 Report issues on [GitHub Issues](https://github.com/yourusername/whatsai-bot/issues)
- 💬 Join discussions in [GitHub Discussions](https://github.com/yourusername/whatsai-bot/discussions)

---

**Happy chatting! 🤖💬**
