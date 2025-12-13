// src/lib/aiCodingService.js
// 🚀 AI Coding Assistant Service - WORKING VERSION
// ✅ Tested with OpenRouter + Free Models

export const AI_PROVIDERS = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-4o-mini', 'gpt-3.5-turbo', 'gpt-4-turbo'],
    endpoint: 'https://api.openai.com/v1/chat/completions',
    supportsStreaming: true
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    endpoint: 'https://api.anthropic.com/v1/messages',
    supportsStreaming: true
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    models: ['gemini-1.5-flash', 'gemini-1.5-pro'],
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    supportsStreaming: false
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    models: [
      'google/gemini-2.0-flash-exp:free',
      'nousresearch/hermes-3-llama-3.1-405b:free',
      'meta-llama/llama-3.2-3b-instruct:free',
      'microsoft/phi-3-mini-128k-instruct:free',
      'google/gemini-flash-1.5',
      'openai/gpt-4o-mini',
      'anthropic/claude-3.5-sonnet'
    ],
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    supportsStreaming: true
  }
};

// 🎯 AI Settings Manager
export class AISettingsManager {
  static STORAGE_KEY = 'devstudio_ai_settings';

  static getSettings() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      provider: 'openrouter',
      model: 'google/gemini-2.0-flash-exp:free',
      apiKey: '',
      autoApply: false,
      temperature: 0.7,
      maxTokens: 2048
    };
  }

  static saveSettings(settings) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
  }

  static updateSetting(key, value) {
    const settings = this.getSettings();
    settings[key] = value;
    this.saveSettings(settings);
    return settings;
  }
}

// 🧠 Project Context Builder
export class ProjectContextBuilder {
  static buildContext(files, activeFile) {
    const context = {
      projectStructure: this.getProjectStructure(files),
      activeFile: activeFile ? {
        name: activeFile.name,
        path: activeFile.path,
        language: this.detectLanguage(activeFile.name),
        content: activeFile.content,
        lines: activeFile.content.split('\n').length
      } : null,
      dependencies: this.detectDependencies(files),
      frameworks: this.detectFrameworks(files)
    };

    return context;
  }

  static getProjectStructure(files) {
    return files.slice(0, 10).map(f => ({
      name: f.name,
      path: f.path,
      type: f.type
    }));
  }

  static detectLanguage(filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap = {
      js: 'javascript', jsx: 'react', ts: 'typescript', tsx: 'react-typescript',
      py: 'python', java: 'java', cpp: 'cpp', c: 'c', cs: 'csharp',
      go: 'go', rs: 'rust', rb: 'ruby', php: 'php', swift: 'swift',
      html: 'html', css: 'css', scss: 'scss', json: 'json', md: 'markdown'
    };
    return langMap[ext] || 'plaintext';
  }

  static detectDependencies(files) {
    const pkgJson = files.find(f => f.name === 'package.json');
    if (pkgJson?.content) {
      try {
        const pkg = JSON.parse(pkgJson.content);
        return {
          dependencies: pkg.dependencies || {},
          devDependencies: pkg.devDependencies || {}
        };
      } catch (e) {
        return {};
      }
    }
    return {};
  }

  static detectFrameworks(files) {
    const frameworks = [];
    const pkgJson = files.find(f => f.name === 'package.json');
    
    if (pkgJson?.content) {
      try {
        const pkg = JSON.parse(pkgJson.content);
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        
        if (allDeps.react) frameworks.push('React');
        if (allDeps.vue) frameworks.push('Vue');
        if (allDeps.angular) frameworks.push('Angular');
        if (allDeps.electron) frameworks.push('Electron');
        if (allDeps.express) frameworks.push('Express');
        if (allDeps.next) frameworks.push('Next.js');
      } catch (e) {}
    }
    
    return frameworks;
  }
}

// 🤖 AI Code Generator
export class AICodeGenerator {
  constructor(provider, apiKey, model) {
    this.provider = provider;
    this.apiKey = apiKey;
    this.model = model;
    this.abortController = null;
  }

  async generateCode(prompt, context, onChunk = null, onComplete = null) {
    const providerConfig = AI_PROVIDERS[this.provider];
    
    if (!providerConfig) {
      throw new Error(`Unknown provider: ${this.provider}`);
    }

    const systemPrompt = this.buildSystemPrompt(context);
    
    try {
      if (this.provider === 'gemini') {
        return await this.generateGemini(prompt, systemPrompt, onChunk, onComplete);
      } else if (this.provider === 'anthropic') {
        return await this.generateAnthropic(prompt, systemPrompt, onChunk, onComplete);
      } else {
        return await this.generateOpenAI(prompt, systemPrompt, onChunk, onComplete);
      }
    } catch (error) {
      throw new Error(`AI Generation Error: ${error.message}`);
    }
  }

  buildSystemPrompt(context) {
    let prompt = `You are BLACKBOXAI - an advanced coding assistant integrated into DevStudio IDE.

YOUR CAPABILITIES:
1. Create/edit files in the project
2. Execute terminal commands (PowerShell)
3. Read project structure and files
4. Install npm packages
5. Run git commands (ONLY when user explicitly asks)
6. Generate complete applications from scratch

IMPORTANT RULES:
1. **For EMPTY projects:**
   - First, create project folder structure using terminal
   - Example: COMMAND: mkdir src && mkdir src/components
   - Then create files one by one
   - NEVER create multiple files simultaneously

2. **File Operations Format:**
   FILE: path/to/file.js
   \`\`\`javascript
   // Complete working code here
   \`\`\`

3. **Terminal Commands:**
   COMMAND: npm install package-name
   COMMAND: mkdir folder-name
   COMMAND: cd src && touch index.js

4. **Git Operations (ONLY when user asks):**
   GIT: git init
   GIT: git add .
   GIT: git commit -m "message"

5. **Response Structure:**
   - First explain what you're doing
   - Then provide file/command operations
   - One file at a time
   - Use clear, descriptive comments

6. **Code Quality:**
   - Write complete, working code
   - No placeholders or TODOs
   - Include error handling
   - Add helpful comments

7. **Progress Updates:**
   After each operation, explain:
   - ✅ What was created/modified
   - 📁 File structure changes
   - 🔧 Next steps (if any)`;

    if (context?.activeFile) {
      const content = context.activeFile.content.slice(0, 800);
      prompt += `\n\nCURRENT FILE: ${context.activeFile.name}
Language: ${context.activeFile.language}
Path: ${context.activeFile.path}

Content (preview):
\`\`\`${context.activeFile.language}
${content}${context.activeFile.content.length > 800 ? '...(truncated)' : ''}
\`\`\``;
    }

    if (context?.frameworks?.length > 0) {
      prompt += `\n\nPROJECT FRAMEWORKS: ${context.frameworks.join(', ')}`;
    }

    if (context?.projectStructure?.length > 0) {
      prompt += `\n\nPROJECT STRUCTURE:\n${context.projectStructure.map(f => `- ${f.path}`).join('\n')}`;
    } else {
      prompt += `\n\n⚠️ PROJECT IS EMPTY - Start by creating folder structure using COMMAND`;
    }

    return prompt;
  }

  async generateOpenAI(prompt, systemPrompt, onChunk, onComplete) {
    const providerConfig = AI_PROVIDERS[this.provider];
    this.abortController = new AbortController();

    const response = await fetch(providerConfig.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...(this.provider === 'openrouter' && {
          'HTTP-Referer': 'https://devstudio.ai',
          'X-Title': 'DevStudio AI'
        })
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        stream: !!onChunk,
        temperature: 0.7,
        max_tokens: 2048
      }),
      signal: this.abortController.signal
    });

    if (!response.ok) {
      const error = await response.json();
      const errorMsg = error.error?.message || error.message || `HTTP ${response.status}`;
      throw new Error(errorMsg);
    }

    if (onChunk) {
      return this.handleStreamResponse(response, onChunk, onComplete);
    } else {
      const data = await response.json();
      return data.choices[0].message.content;
    }
  }

  async generateAnthropic(prompt, systemPrompt, onChunk, onComplete) {
    this.abortController = new AbortController();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
        stream: !!onChunk
      }),
      signal: this.abortController.signal
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Anthropic Error: ${response.status}`);
    }

    if (onChunk) {
      return this.handleAnthropicStream(response, onChunk, onComplete);
    } else {
      const data = await response.json();
      return data.content[0].text;
    }
  }

  async generateGemini(prompt, systemPrompt, onChunk, onComplete) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    
    this.abortController = new AbortController();
    const fullPrompt = `${systemPrompt}\n\nUser: ${prompt}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      }),
      signal: this.abortController.signal
    });

    if (!response.ok) {
      const error = await response.json();
      const errorMsg = error.error?.message || `Gemini Error: ${response.status}`;
      throw new Error(errorMsg);
    }

    const data = await response.json();
    if (!data.candidates || !data.candidates[0]) {
      throw new Error('No response from Gemini');
    }
    
    const text = data.candidates[0].content.parts[0].text;
    
    // Simulate streaming
    if (onChunk) {
      const words = text.split(' ');
      for (const word of words) {
        onChunk(word + ' ');
        await new Promise(r => setTimeout(r, 50));
      }
      if (onComplete) onComplete(text);
    }
    
    return text;
  }

  async handleStreamResponse(response, onChunk, onComplete) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                fullText += content;
                onChunk(content);
              }
            } catch (e) {
              console.warn('Parse error:', e);
            }
          }
        }
      }
    } finally {
      if (onComplete) onComplete(fullText);
    }

    return fullText;
  }

  async handleAnthropicStream(response, onChunk, onComplete) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta') {
                const content = parsed.delta?.text || '';
                if (content) {
                  fullText += content;
                  onChunk(content);
                }
              }
            } catch (e) {
              console.warn('Parse error:', e);
            }
          }
        }
      }
    } finally {
      if (onComplete) onComplete(fullText);
    }

    return fullText;
  }

  abort() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}

// 📝 Code Parser & Applier
export class CodeParser {
  static parseAIResponse(response) {
    const operations = [];
    
    // Parse FILE operations (multiple formats)
    const fileRegex = /FILE:\s*([^\n]+)\n```(\w+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = fileRegex.exec(response)) !== null) {
      operations.push({
        type: 'file',
        path: match[1].trim(),
        language: match[2] || 'plaintext',
        content: match[3].trim(),
        action: 'create/update'
      });
    }

    // Also parse standalone code blocks (if no FILE: prefix)
    if (operations.length === 0) {
      const standaloneCodeRegex = /```(\w+)\n([\s\S]*?)```/g;
      while ((match = standaloneCodeRegex.exec(response)) !== null) {
        operations.push({
          type: 'code',
          language: match[1],
          content: match[2].trim()
        });
      }
    }

    // Parse COMMAND operations
    const cmdRegex = /COMMAND:\s*([^\n]+)/gi;
    while ((match = cmdRegex.exec(response)) !== null) {
      operations.push({
        type: 'command',
        command: match[1].trim()
      });
    }

    // Parse GIT operations
    const gitRegex = /GIT:\s*([^\n]+)/gi;
    while ((match = gitRegex.exec(response)) !== null) {
      operations.push({
        type: 'git',
        command: match[1].trim(),
        requiresApproval: true // Always ask user
      });
    }

    // Extract summary (first paragraph)
    const lines = response.split('\n');
    const summary = lines.slice(0, 5).join('\n').trim();

    return {
      operations,
      hasCode: operations.some(op => op.type === 'file' || op.type === 'code'),
      hasCommands: operations.some(op => op.type === 'command'),
      hasGit: operations.some(op => op.type === 'git'),
      summary: summary.substring(0, 200),
      rawResponse: response
    };
  }

  static extractCodeBlocks(text) {
    const blocks = [];
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      blocks.push({
        language: match[1] || 'plaintext',
        code: match[2].trim()
      });
    }

    return blocks;
  }

  static computeDiff(oldCode, newCode) {
    const oldLines = oldCode.split('\n');
    const newLines = newCode.split('\n');
    const changes = [];

    // Simple line-by-line diff
    const maxLen = Math.max(oldLines.length, newLines.length);
    
    for (let i = 0; i < maxLen; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];
      
      if (oldLine === undefined && newLine !== undefined) {
        changes.push({ type: 'add', line: i + 1, content: newLine });
      } else if (oldLine !== undefined && newLine === undefined) {
        changes.push({ type: 'remove', line: i + 1, content: oldLine });
      } else if (oldLine !== newLine) {
        changes.push({ type: 'modify', line: i + 1, oldContent: oldLine, newContent: newLine });
      }
    }

    return {
      changes,
      additions: changes.filter(c => c.type === 'add').length,
      deletions: changes.filter(c => c.type === 'remove').length,
      modifications: changes.filter(c => c.type === 'modify').length
    };
  }

  // Extract file path from AI suggestion
  static suggestFilePath(content, language) {
    // Try to detect from imports/requires
    if (language === 'javascript' || language === 'typescript') {
      if (content.includes('import React') || content.includes('export default')) {
        return 'src/App.jsx';
      }
      if (content.includes('express(')) {
        return 'src/server.js';
      }
    }
    
    // Default based on language
    const defaultPaths = {
      javascript: 'src/index.js',
      typescript: 'src/index.ts',
      python: 'main.py',
      html: 'index.html',
      css: 'styles.css'
    };
    
    return defaultPaths[language] || 'untitled.txt';
  }
}