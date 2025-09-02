# WhatsApp AI Bot Project Plan

## Project Overview
A modular WhatsApp bot built with Node.js that uses Google's Gemini AI to automatically respond to incoming messages. The bot will maintain persistent sessions to avoid repeated QR code scanning.

## Core Features
- **Persistent WhatsApp Session**: No need to scan QR code repeatedly
- **Gemini AI Integration**: Smart responses using Google's Gemini API
- **Modular Architecture**: Clean separation of concerns for maintainability
- **Incoming Message Only**: Responds only to incoming messages (no token waste)
- **Configurable**: Easy to customize behavior and responses

## Technical Architecture

### 1. Project Structure
```
whatsAI/
├── src/
│   ├── core/
│   │   ├── whatsapp.js          # WhatsApp Web integration
│   │   ├── gemini.js            # Gemini AI integration
│   │   ├── session.js           # Session management
│   │   └── memory.js            # Conversation memory
│   ├── handlers/
│   │   ├── messageHandler.js    # Message processing logic
│   │   ├── responseHandler.js   # Response generation
│   │   └── commandHandler.js    # Bot commands processing
│   ├── utils/
│   │   ├── logger.js            # Logging utility
│   │   ├── config.js            # Configuration management
│   │   └── helpers.js           # Helper functions
│   └── index.js                 # Main application entry point
├── sessions/                    # WhatsApp session storage
├── conversations/              # Conversation history storage
├── config/
│   └── default.json            # Default configuration
├── logs/                       # Application logs
├── .env                        # Environment variables
├── package.json
└── README.md
```

### 2. Core Dependencies
- **whatsapp-web.js**: WhatsApp Web API integration
- **@google/generative-ai**: Google Gemini AI SDK
- **qrcode-terminal**: QR code display in terminal
- **winston**: Logging framework
- **dotenv**: Environment variable management
- **fs-extra**: Enhanced file system operations

### 3. Key Modules

#### WhatsApp Integration (`src/core/whatsapp.js`)
- Initialize WhatsApp Web client
- Handle QR code generation and display
- Manage session persistence
- Listen for incoming messages
- Send responses

#### Gemini AI Integration (`src/core/gemini.js`)
- Configure Gemini API client
- Generate contextual responses with customizable personality
- Handle API rate limiting
- Manage conversation context with token optimization
- Apply personality settings to prompts
- Implement conversation summarization for long chats

#### Session Management (`src/core/session.js`)
- Save and restore WhatsApp sessions
- Handle session expiration
- Manage multiple session files

#### Conversation Memory (`src/core/memory.js`)
- Store and retrieve conversation history
- Implement conversation summarization
- Manage context window for token optimization
- Compress old messages while preserving context

#### Message Handler (`src/handlers/messageHandler.js`)
- Process incoming messages
- Filter relevant messages (ignore own messages, group chats, etc.)
- Only respond to direct/private messages
- Extract message content and metadata
- Check for commands before AI processing
- Trigger response generation

#### Response Handler (`src/handlers/responseHandler.js`)
- Generate AI responses using Gemini
- Format responses appropriately
- Handle response failures gracefully
- Optional response delays to appear more human

#### Command Handler (`src/handlers/commandHandler.js`)
- Process bot commands (/help, /status, /stop, /start, /info)
- Handle user preferences and settings
- Manage response enable/disable per user
- Provide bot information and status

### 4. Configuration Options
- **Gemini API Key**: Required for AI responses
- **Response Settings**: 
  - Enable/disable auto-responses
  - Optional response delay (to appear more human)
  - Maximum response length
  - Customizable personality/tone (friendly, professional, casual, etc.)
- **WhatsApp Settings**:
  - Session timeout
  - QR code display options
- **Filtering Options**:
  - Only respond to direct/private messages (groups ignored by default)
  - Ignore specific contacts
  - Response frequency limits
- **Command Settings**:
  - Available commands: /help, /status, /stop, /start, /info
  - Per-user response enable/disable
  - Command prefix customization

### 5. Session Persistence Strategy
- Store WhatsApp session data in `sessions/` directory
- Use file-based session storage (whatsapp-web.js default)
- Implement session validation and cleanup
- Handle session corruption gracefully

### 6. Error Handling & Logging
- Comprehensive error handling for all modules
- Structured logging with different levels (info, warn, error)
- Log rotation to prevent disk space issues
- Graceful degradation when services are unavailable

### 7. Security Considerations
- Store sensitive data (API keys) in environment variables
- Validate all incoming messages
- Implement rate limiting for API calls
- Secure session file storage

### 8. Development Phases

#### Phase 1: Core Setup
- Project structure creation
- Basic WhatsApp Web integration
- Session persistence implementation
- Basic logging setup

#### Phase 2: AI Integration
- Gemini API integration
- Basic response generation
- Message filtering logic
- Configuration management

#### Phase 3: Advanced Features
- Response customization
- Error handling improvements
- Performance optimizations
- Documentation

#### Phase 4: Testing & Deployment
- Comprehensive testing
- Production configuration
- Deployment documentation
- Monitoring setup

### 9. Usage Flow
1. **Startup**: Load configuration, initialize WhatsApp client
2. **Authentication**: Display QR code or restore existing session
3. **Message Listening**: Listen for incoming messages
4. **Message Processing**: Filter and process relevant messages
5. **AI Response**: Generate response using Gemini AI
6. **Response Sending**: Send formatted response back to user
7. **Logging**: Log all activities for monitoring

### 10. Token Optimization Strategy
- Only respond to incoming messages (not outgoing)
- Implement response cooldowns to prevent spam
- Cache common responses for similar queries
- Use efficient prompt engineering for Gemini
- Monitor API usage and implement limits
- **Conversation Memory Optimization**:
  - Store full conversation history locally
  - Use conversation summarization for long chats
  - Send only recent messages + summary to Gemini
  - Implement smart context window management
  - Compress old messages while preserving key information

## Getting Started Requirements
1. Node.js (v16 or higher)
2. Google Gemini API key
3. WhatsApp account for the bot
4. Terminal access for QR code scanning

## Estimated Development Time
- **Phase 1**: 2-3 hours
- **Phase 2**: 3-4 hours  
- **Phase 3**: 2-3 hours
- **Phase 4**: 1-2 hours
- **Total**: 8-12 hours

This plan provides a solid foundation for building a robust, modular WhatsApp AI bot that meets your requirements for persistent sessions, Gemini AI integration, and efficient token usage.
