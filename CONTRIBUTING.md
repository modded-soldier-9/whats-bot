# Contributing to WhatsApp AI Bot

Thank you for your interest in contributing to WhatsApp AI Bot! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

1. **Check existing issues** first to avoid duplicates
2. **Use the issue template** when creating new issues
3. **Provide detailed information**:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (Node.js version, OS, etc.)
   - Log files (if applicable)

### Suggesting Features

1. **Check existing feature requests** first
2. **Describe the feature** clearly
3. **Explain the use case** and benefits
4. **Consider implementation complexity**

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Follow coding standards** (see below)
4. **Add tests** for new functionality
5. **Update documentation** as needed
6. **Submit a pull request**

## 📋 Development Setup

### Prerequisites

- Node.js v16 or higher
- npm or yarn
- Git

### Setup Steps

1. **Fork and clone** the repository
   ```bash
   git clone https://github.com/yourusername/whatsai-bot.git
   cd whatsai-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Run in development mode**
   ```bash
   npm run dev
   ```

## 🎨 Coding Standards

### Code Style

- **Use ESLint** configuration provided in the project
- **Follow existing patterns** in the codebase
- **Use meaningful variable names**
- **Add JSDoc comments** for functions and classes
- **Keep functions small and focused**

### File Organization

- **Core functionality** goes in `src/core/`
- **Message handlers** go in `src/handlers/`
- **Utilities** go in `src/utils/`
- **Configuration** goes in `config/`
- **Personalities** go in `personalities/`

### Commit Messages

Use conventional commit format:

```
type(scope): description

Examples:
feat(personality): add new personality profile
fix(memory): resolve conversation summarization bug
docs(readme): update installation instructions
refactor(handlers): improve message processing flow
```

## 🧪 Testing

### Manual Testing

1. **Test all commands** (`/help`, `/status`, `/personalities`, etc.)
2. **Test different personalities** by switching configurations
3. **Test conversation memory** with long conversations
4. **Test error handling** with invalid inputs

### Test Scenarios

- [ ] Bot responds to direct messages
- [ ] Bot ignores group messages
- [ ] Commands work correctly
- [ ] Personality switching works
- [ ] Conversation memory persists
- [ ] Error handling works gracefully

## 📝 Documentation

### Code Documentation

- **Add JSDoc comments** for all public functions
- **Document complex logic** with inline comments
- **Update README.md** for new features
- **Update personality examples** if adding new personality features

### Pull Request Documentation

Include in your PR:

- **Description** of changes
- **Testing steps** performed
- **Screenshots** (if UI changes)
- **Breaking changes** (if any)

## 🎭 Personality Development

### Creating New Personalities

1. **Create JSON file** in `personalities/` folder
2. **Follow the schema**:
   ```json
   {
     "name": "unique_name",
     "displayName": "Display Name",
     "description": "Brief description",
     "prompt": "Detailed AI instructions...",
     "maxResponseLength": 100,
     "responseDelay": 0,
     "languageSupport": {
       "english": true,
       "arabic": false
     },
     "slang": {
       "common": ["word1", "word2"],
       "reassurance": ["phrase1"],
       "greetings": ["hello"],
       "confirmations": ["yes"]
     },
     "emojis": {
       "frequent": ["😊"],
       "occasional": ["😂"]
     }
   }
   ```

3. **Test thoroughly** with various message types
4. **Update documentation** with personality description

### Personality Guidelines

- **Keep prompts clear** and specific
- **Test with different languages** if supported
- **Ensure appropriate response length**
- **Use realistic slang and expressions**

## 🐛 Bug Fixes

### Before Fixing

1. **Reproduce the bug** consistently
2. **Identify root cause**
3. **Check for similar issues**
4. **Consider edge cases**

### During Fixing

1. **Make minimal changes** to fix the issue
2. **Add tests** to prevent regression
3. **Update documentation** if needed
4. **Test thoroughly** before submitting

## 🚀 Release Process

### Version Bumping

- **Patch** (1.0.1): Bug fixes
- **Minor** (1.1.0): New features, backward compatible
- **Major** (2.0.0): Breaking changes

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] Version bumped in package.json
- [ ] CHANGELOG.md updated
- [ ] Release notes prepared

## 📞 Getting Help

### Communication Channels

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and ideas
- **Pull Request Comments**: For code review discussions

### Response Times

- **Issues**: Within 48 hours
- **Pull Requests**: Within 72 hours
- **Discussions**: Within 24 hours

## 🏆 Recognition

Contributors will be recognized in:

- **README.md** contributors section
- **Release notes** for significant contributions
- **GitHub contributors** page

## 📋 Code of Conduct

### Our Standards

- **Be respectful** and inclusive
- **Be constructive** in feedback
- **Be patient** with newcomers
- **Be collaborative** in discussions

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or inflammatory comments
- Spam or off-topic discussions
- Personal attacks

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to WhatsApp AI Bot! 🎉
