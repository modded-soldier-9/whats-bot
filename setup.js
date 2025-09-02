#!/usr/bin/env node

/**
 * WhatsApp AI Bot Setup Script
 * Automates the initial setup process for new users
 */

const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setup() {
    console.log('🤖 WhatsApp AI Bot Setup');
    console.log('========================\n');

    try {
        // Check if .env already exists
        const envPath = path.join(process.cwd(), '.env');
        if (await fs.pathExists(envPath)) {
            const overwrite = await question('⚠️  .env file already exists. Overwrite? (y/N): ');
            if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
                console.log('❌ Setup cancelled.');
                process.exit(0);
            }
        }

        console.log('📝 Let\'s configure your bot...\n');

        // Get Gemini API key
        console.log('🔑 Gemini AI Configuration');
        console.log('Get your API key from: https://ai.google.dev/');
        const apiKey = await question('Enter your Gemini API key: ');
        
        if (!apiKey.trim()) {
            console.log('❌ API key is required!');
            process.exit(1);
        }

        // Get personality preference
        console.log('\n🎭 Personality Selection');
        console.log('Available personalities:');
        console.log('1. Custom (Your Style) - Mimics your communication style');
        console.log('2. Friendly - Warm and approachable');
        console.log('3. Professional - Formal and business-like');
        console.log('4. Casual - Relaxed and conversational');
        console.log('5. Humorous - Witty and funny');
        console.log('6. Neutral - Straightforward and balanced');
        
        const personalityChoice = await question('Choose personality (1-6, default: 1): ');
        const personalities = ['custom', 'friendly', 'professional', 'casual', 'humorous', 'neutral'];
        const personalityIndex = parseInt(personalityChoice) - 1;
        const personality = personalities[personalityIndex] || 'custom';

        // Get response length preference
        console.log('\n📏 Response Length');
        const maxLength = await question('Max response length in characters (default: 100): ');
        const responseLength = parseInt(maxLength) || 100;

        // Get response delay preference
        console.log('\n⏱️  Response Delay');
        console.log('Add delay to make responses appear more human-like');
        const delay = await question('Response delay in milliseconds (default: 0): ');
        const responseDelay = parseInt(delay) || 0;

        // Get logging preference
        console.log('\n📊 Logging Level');
        console.log('1. error - Only errors');
        console.log('2. warn - Warnings and errors');
        console.log('3. info - General information (recommended)');
        console.log('4. debug - Detailed debugging info');
        
        const logChoice = await question('Choose logging level (1-4, default: 3): ');
        const logLevels = ['error', 'warn', 'info', 'debug'];
        const logIndex = parseInt(logChoice) - 1;
        const logLevel = logLevels[logIndex] || 'info';

        // Create .env file
        const envContent = `# WhatsApp AI Bot Configuration

# Gemini AI Configuration
GEMINI_API_KEY=${apiKey.trim()}

# Bot Configuration
BOT_PERSONALITY=${personality}
RESPONSE_DELAY=${responseDelay}
MAX_RESPONSE_LENGTH=${responseLength}
AUTO_RESPONSES_ENABLED=true

# WhatsApp Configuration
SESSION_TIMEOUT=300000
QR_CODE_DISPLAY=true

# Logging Configuration
LOG_LEVEL=${logLevel}
LOG_FILE_MAX_SIZE=10m
LOG_FILE_MAX_FILES=5

# Command Configuration
COMMAND_PREFIX=/
ENABLE_COMMANDS=true

# Filtering Configuration
IGNORE_GROUPS=true
RESPONSE_FREQUENCY_LIMIT=10
`;

        await fs.writeFile(envPath, envContent);

        // Create necessary directories
        const directories = ['conversations', 'sessions', 'logs'];
        for (const dir of directories) {
            await fs.ensureDir(dir);
        }

        console.log('\n✅ Setup Complete!');
        console.log('==================');
        console.log(`📁 Configuration saved to: ${envPath}`);
        console.log(`🎭 Selected personality: ${personality}`);
        console.log(`📏 Max response length: ${responseLength} characters`);
        console.log(`⏱️  Response delay: ${responseDelay}ms`);
        console.log(`📊 Logging level: ${logLevel}`);
        console.log('\n🚀 Next Steps:');
        console.log('1. Run: npm start');
        console.log('2. Scan the QR code with your WhatsApp');
        console.log('3. Start chatting with your bot!');
        console.log('\n📚 For more information, see README.md');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Run setup if this script is executed directly
if (require.main === module) {
    setup();
}

module.exports = setup;
