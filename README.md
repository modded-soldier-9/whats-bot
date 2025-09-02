# WhatsApp AI Bot 🤖

A modular WhatsApp bot powered by Google Gemini AI that responds to messages with customizable personalities. Features session persistence, conversation memory, and token optimization.

## ✨ Features

- **🤖 AI-Powered Responses**: Uses Google Gemini AI for intelligent, contextual responses
- **🎭 Customizable Personalities**: Multiple personality profiles with file-based configuration
- **💾 Session Persistence**: No need to scan QR code repeatedly
- **🧠 Conversation Memory**: Remembers chat history with smart summarization
- **🌍 Multi-Language Support**: English and Arabic language detection
- **⚡ Token Optimization**: Efficient API usage with conversation summarization
- **🎯 Smart Filtering**: Only responds to direct messages, ignores groups
- **📱 Command System**: Built-in commands for bot control
- **🔧 Modular Design**: Clean, extensible architecture

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- A Google Gemini API key
- WhatsApp account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/whatsai-bot.git
   cd whatsai-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   BOT_PERSONALITY=custom
   ```

4. **Start the bot**
   ```bash
   npm start
   ```

5. **Scan QR code** when it appears in the terminal to connect your WhatsApp

## 🎭 Personality System

The bot supports multiple personality profiles stored in the `personalities/` folder:

### Available Personalities

- **Custom** - Your personalized communication style (default)
- **Friendly** - Warm and approachable
- **Professional** - Formal and business-like
- **Casual** - Relaxed and conversational
- **Humorous** - Witty and funny
- **Neutral** - Straightforward and balanced

### Creating Custom Personalities

Create a new JSON file in `personalities/` folder:

```json
{
  "name": "my_personality",
  "displayName": "My Custom Style",
  "description": "A description of this personality",
  "prompt": "Detailed instructions for the AI...",
  "maxResponseLength": 100,
  "responseDelay": 0,
  "languageSupport": {
    "english": true,
    "arabic": true,
    "arabicInstruction": "Custom Arabic response instructions"
  },
  "slang": {
    "common": ["word1", "word2"],
    "reassurance": ["phrase1", "phrase2"],
    "greetings": ["hello", "hi"],
    "confirmations": ["yes", "ok"]
  },
  "emojis": {
    "frequent": ["😊", "👍"],
    "occasional": ["😂", "😄"]
  }
}
```

## 📱 Commands

Use these commands in WhatsApp to control the bot:

- `/help` - Show available commands
- `/status` - Check bot status and settings
- `/stop` - Disable auto-responses for you
- `/start` - Enable auto-responses for you
- `/info` - Show bot configuration and personality
- `/personalities` - List all available personality profiles

## ⚙️ Configuration

### Environment Variables (.env)

```env
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Bot Settings
BOT_PERSONALITY=custom
RESPONSE_DELAY=0
MAX_RESPONSE_LENGTH=100
AUTO_RESPONSES_ENABLED=true

# WhatsApp Settings
SESSION_TIMEOUT=300000
QR_CODE_DISPLAY=true

# Logging
LOG_LEVEL=info
LOG_FILE_MAX_SIZE=10m
LOG_FILE_MAX_FILES=5

# Commands
COMMAND_PREFIX=/
ENABLE_COMMANDS=true

# Filtering
IGNORE_GROUPS=true
RESPONSE_FREQUENCY_LIMIT=10
```

### Configuration Files

- `config/default.json` - Default configuration values
- `personalities/` - Personality profile files
- `conversations/` - Conversation history (auto-created)
- `sessions/` - WhatsApp session data (auto-created)
- `logs/` - Application logs (auto-created)

## 🏗️ Project Structure

```
whatsai-bot/
├── src/
│   ├── core/
│   │   ├── gemini.js          # Gemini AI integration
│   │   ├── memory.js          # Conversation memory
│   │   └── whatsapp.js        # WhatsApp client
│   ├── handlers/
│   │   ├── commandHandler.js  # Command processing
│   │   ├── messageHandler.js  # Message processing
│   │   └── responseHandler.js # Response generation
│   ├── utils/
│   │   ├── config.js          # Configuration management
│   │   ├── logger.js          # Logging utility
│   │   ├── helpers.js         # Helper functions
│   │   └── personalityLoader.js # Personality system
│   └── index.js               # Main application
├── personalities/             # Personality profiles
├── config/                    # Configuration files
├── conversations/             # Chat history (auto-created)
├── sessions/                  # WhatsApp sessions (auto-created)
├── logs/                      # Application logs (auto-created)
├── .env                       # Environment variables
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

## 🧠 How It Works

### Message Processing Flow

1. **Message Reception**: WhatsApp client receives incoming message
2. **Filtering**: Checks if message should be processed (direct message, not from bot, etc.)
3. **Command Detection**: Checks if message is a bot command
4. **Context Retrieval**: Gets conversation history and summary
5. **AI Processing**: Sends message + context to Gemini AI
6. **Response Generation**: AI generates response using selected personality
7. **Response Sending**: Bot sends response back to user
8. **Memory Update**: Conversation is saved to memory

### Conversation Memory

- **Recent Messages**: Always includes last 10 messages for immediate context
- **Smart Summarization**: When conversation gets long (20+ messages), older messages are summarized
- **Token Optimization**: Summaries reduce API token usage while maintaining context
- **Persistent Storage**: All conversations saved to disk in `conversations/` folder

### Personality System

- **File-Based**: Personalities stored as JSON files in `personalities/` folder
- **Dynamic Loading**: Personalities loaded at startup and can be reloaded
- **Structured Data**: Each personality includes prompt, settings, slang, and emoji preferences
- **Language Support**: Built-in support for multiple languages with custom instructions

## 🔧 Development

### Scripts

```bash
npm start          # Start the bot
npm run dev        # Start with nodemon (auto-restart)
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint errors
```

### Adding New Features

1. **New Commands**: Add to `src/handlers/commandHandler.js`
2. **New Personalities**: Create JSON file in `personalities/` folder
3. **New Handlers**: Create in `src/handlers/` and register in `src/index.js`
4. **New Utilities**: Add to `src/utils/` folder

### Debugging

- Check `logs/` folder for detailed logs
- Use `LOG_LEVEL=debug` in `.env` for verbose logging
- Console output shows real-time message processing

## 🛡️ Security & Privacy

- **Session Data**: WhatsApp sessions stored locally, never shared
- **Conversation Data**: All chat history stored locally
- **API Keys**: Store in `.env` file (not committed to git)
- **No Data Collection**: Bot doesn't collect or share personal data

## 📋 Requirements

- **Node.js**: v16 or higher
- **Google Gemini API**: Free tier available
- **WhatsApp**: Personal or business account
- **Storage**: ~100MB for sessions and conversations

## 🐛 Troubleshooting

### Common Issues

1. **"GEMINI_API_KEY is required"**
   - Make sure `.env` file exists and contains your API key

2. **"Failed to initialize WhatsApp"**
   - Check internet connection
   - Try deleting `sessions/` folder and restart

3. **"Bot not responding"**
   - Check if auto-responses are enabled (`/start` command)
   - Verify personality is set correctly
   - Check logs for errors

4. **"QR code not appearing"**
   - Make sure `QR_CODE_DISPLAY=true` in `.env`
   - Check terminal output for QR code

### Getting Help

- Check the logs in `logs/` folder
- Use `/status` command to check bot configuration
- Ensure all dependencies are installed: `npm install`

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 🙏 Acknowledgments

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) - WhatsApp Web API
- [Google Gemini AI](https://ai.google.dev/) - AI response generation
- [Winston](https://github.com/winstonjs/winston) - Logging framework

---

**Made with ❤️ for the WhatsApp community**

*This bot is for personal use. Please respect WhatsApp's Terms of Service and use responsibly.*