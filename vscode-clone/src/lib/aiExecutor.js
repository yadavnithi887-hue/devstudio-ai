// src/lib/aiExecutor.js
// 🤖 Smart AI Execution Engine with Auto Terminal Detection

export class AIExecutor {
  constructor({
    getCurrentTerminalPath, // Function to get current terminal working directory
    executeCommand,         // Function to run terminal commands
    createFile,            // Function to create files
    updateFile,            // Function to update files  
    openFile,              // Function to open file in editor
    onProgress,            // Callback for progress updates
    onError                // Callback for errors
  }) {
    this.getCurrentTerminalPath = getCurrentTerminalPath;
    this.executeCommand = executeCommand;
    this.createFile = createFile;
    this.updateFile = updateFile;
    this.openFile = openFile;
    this.onProgress = onProgress;
    this.onError = onError;
    this.isExecuting = false;
  }

  // Get current terminal path dynamically
  getTerminalPath() {
    if (this.getCurrentTerminalPath) {
      return this.getCurrentTerminalPath();
    }
    // Fallback: try to detect from environment
    return process.env.USERPROFILE || process.env.HOME || 'C:\\Users';
  }

  // Main execution method
  async execute(aiResponse) {
    const terminalPath = this.getTerminalPath();
    console.log('🤖 AI Executor: Starting execution...');
    console.log('📍 Terminal Path:', terminalPath);
    
    // Parse AI response for operations
    const operations = this.parseOperations(aiResponse);
    console.log('📋 Operations found:', operations.length);
    
    if (operations.length === 0) {
      this.onProgress({
        type: 'info',
        message: 'AI provided explanation without executable operations',
        isChat: true
      });
      return { success: true, results: [], isExplanation: true };
    }

    // Execute operations sequentially
    const results = [];
    for (const op of operations) {
      try {
        this.onProgress({
          type: 'executing',
          message: `Executing: ${op.type} - ${op.command || op.path || 'operation'}`,
          operation: op
        });

        const result = await this.executeOperation(op, terminalPath);
        results.push(result);
        
        if (!result.success) {
          this.onError({
            operation: op,
            error: result.error,
            message: `❌ Failed: ${op.type} - ${result.error}`
          });
          
          // Don't stop on error, continue with next operation
          continue;
        }
      } catch (error) {
        console.error('Execution error:', error);
        this.onError({
          operation: op,
          error: error.message
        });
      }
    }

    return { success: true, results };
  }

  // Parse AI response into executable operations
  parseOperations(response) {
    const operations = [];
    
    // Match COMMAND: operations
    const cmdRegex = /COMMAND:\s*([^\n]+)/gi;
    let match;
    
    while ((match = cmdRegex.exec(response)) !== null) {
      operations.push({
        type: 'command',
        command: match[1].trim(),
        index: match.index
      });
    }

    // Match FILE: operations
    const fileRegex = /FILE:\s*([^\n]+)\n```(\w+)?\n([\s\S]*?)```/gi;
    
    while ((match = fileRegex.exec(response)) !== null) {
      operations.push({
        type: 'file',
        path: match[1].trim(),
        language: match[2] || 'plaintext',
        content: match[3].trim(),
        index: match.index
      });
    }

    // Sort by appearance order
    operations.sort((a, b) => a.index - b.index);
    
    return operations;
  }

  // Execute single operation
  async executeOperation(operation, basePath) {
    console.log(`⚡ Executing ${operation.type}:`, operation);

    switch (operation.type) {
      case 'command':
        return await this.executeCommandOperation(operation, basePath);
      
      case 'file':
        return await this.executeFileOperation(operation, basePath);
      
      default:
        return { success: false, error: 'Unknown operation type' };
    }
  }

  // Execute terminal command
  async executeCommandOperation(operation, basePath) {
    this.onProgress({
      type: 'command',
      message: `Running: ${operation.command}`,
      command: operation.command
    });

    try {
      // Execute command
      const result = await this.executeCommand(operation.command);
      
      if (result.success) {
        this.onProgress({
          type: 'success',
          message: `✅ Executed: ${operation.command}`,
          output: result.output
        });
        
        return { success: true, output: result.output };
      } else {
        this.onProgress({
          type: 'error',
          message: `❌ Failed: ${result.error || 'Unknown error'}`,
          error: result.error
        });
        
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      console.error('Command execution error:', error);
      
      this.onProgress({
        type: 'error',
        message: `❌ Error: ${error.message}`
      });
      
      return { success: false, error: error.message };
    }
  }

  // Execute file operation
  async executeFileOperation(operation, basePath) {
    // Resolve full path
    let fullPath = operation.path;
    
    // If not absolute path, make it relative to project root
    if (!fullPath.match(/^[A-Z]:\\/i) && !fullPath.startsWith('/')) {
      // Get project root from localStorage or use terminal path
      const projectRoot = localStorage.getItem('devstudio-last-project');
      if (projectRoot) {
        const isWindows = projectRoot.includes('\\');
        const sep = isWindows ? '\\' : '/';
        fullPath = `${projectRoot}${sep}${operation.path.replace(/\//g, sep)}`;
      } else {
        fullPath = `${basePath}\\${operation.path.replace(/\//g, '\\')}`;
      }
    }
    
    this.onProgress({
      type: 'file',
      message: `Creating: ${operation.path}`,
      path: fullPath
    });

    try {
      // Create/update file
      const result = await this.createFile(fullPath, operation.content);
      
      if (result.success) {
        const fileName = operation.path.split(/[/\\]/).pop();
        this.onProgress({
          type: 'success',
          message: `✅ Created: ${fileName} (${operation.content.split('\n').length} lines)`,
          path: fullPath
        });

        // Auto-open file in editor
        if (this.openFile) {
          setTimeout(() => {
            this.openFile({ 
              id: fullPath,
              realPath: fullPath,
              path: operation.path,
              name: fileName,
              content: operation.content,
              type: 'file'
            });
          }, 300);
        }

        return { success: true, path: fullPath };
      } else {
        throw new Error(result.error || 'Failed to create file');
      }
      
    } catch (error) {
      console.error('File creation error:', error);
      
      this.onProgress({
        type: 'error',
        message: `❌ Failed to create ${operation.path}: ${error.message}`
      });
      
      return { success: false, error: error.message };
    }
  }
}

// 🎯 Smart System Prompt Generator (Auto-detects everything)
export function generateSmartSystemPrompt({ terminalPath, projectRoot, files, frameworks, activeFile }) {
  const projectEmpty = !files || files.length === 0;
  const hasProjectOpen = !!projectRoot;
  
  return `You are BLACKBOXAI - an advanced AI coding assistant with REAL EXECUTION CAPABILITIES.

CURRENT SYSTEM STATE:
- Terminal Working Directory: ${terminalPath || 'Not detected'}
- Project Root: ${projectRoot || 'No project open (empty workspace)'}
- Project Status: ${projectEmpty ? '⚠️ EMPTY - No files exist' : `✅ ${files.length} files`}
${frameworks && frameworks.length > 0 ? `- Detected Frameworks: ${frameworks.join(', ')}` : ''}
${activeFile ? `- Active File: ${activeFile.name} (${activeFile.language})` : ''}

YOUR CAPABILITIES & EXECUTION RULES:

1. **UNDERSTANDING PROJECT STATE:**
   ${projectEmpty ? `
   ⚠️ Project is EMPTY - You need to create everything from scratch!
   
   Your workflow:
   Step 1: Ask user where they want to create the project
   Step 2: Create project folder structure
   Step 3: Create files one by one
   Step 4: Provide next steps
   ` : `
   ✅ Project exists - You can read and modify files
   
   Available files:
   ${files.slice(0, 10).map(f => `   - ${f.path || f.name}`).join('\n')}
   `}

2. **COMMAND EXECUTION FORMAT:**
   \`\`\`
   COMMAND: mkdir project-name
   COMMAND: cd project-name && mkdir src
   COMMAND: npm install package-name
   \`\`\`
   
   Commands will be executed in: ${terminalPath || 'current terminal directory'}

3. **FILE CREATION FORMAT:**
   \`\`\`
   FILE: src/index.html
   \`\`\`html
   <!DOCTYPE html>
   <html>...</html>
   \`\`\`
   
   FILE: src/app.ts
   \`\`\`typescript
   // Your code here
   \`\`\`
   \`\`\`
   
   Files will be created in: ${projectRoot || 'project directory you specify'}

4. **WORKFLOW FOR NEW PROJECT:**
   \`\`\`
   Step 1: Explain what you'll build
   
   Step 2: Create project folder
   COMMAND: mkdir "my-project"
   
   Step 3: Create structure
   COMMAND: cd my-project && mkdir src && mkdir public
   
   Step 4: Create files ONE BY ONE
   FILE: src/index.html
   \`\`\`html
   ...
   \`\`\`
   
   FILE: src/app.ts
   \`\`\`typescript
   ...
   \`\`\`
   
   Step 5: Provide instructions
   ✅ Project created! Next steps:
   - cd my-project
   - npm install
   - npm start
   \`\`\`

5. **COMMUNICATION STYLE:**
   - Keep explanations SHORT and CLEAR
   - Show progress with emojis:
     🔨 Creating...
     ✅ Done
     ❌ Error
     📁 Folder
     📝 File
   - Don't paste full code in chat unless explaining concepts
   - Use FILE: and COMMAND: for operations

6. **IMPORTANT RULES:**
   - ✅ Create files ONE BY ONE (not simultaneously)
   - ✅ Use complete, working code (no TODOs or placeholders)
   - ✅ Add helpful comments
   - ✅ Wait for command confirmation before next step
   - ❌ Don't suggest git commands unless user asks
   - ❌ Don't use relative paths like ./src (use full paths or just src/)

7. **ERROR HANDLING:**
   If a command fails:
   - Explain the error
   - Provide alternative solution
   - Continue with next steps

EXAMPLE RESPONSE FORMAT:

User: "create a todo app in react"

You:
I'll create a React todo app with TypeScript. Here's what I'll build:
- React + TypeScript setup
- Todo component with add/delete
- Local storage persistence

🔨 Step 1: Creating project structure

COMMAND: mkdir todo-app

COMMAND: cd todo-app && mkdir src public

🔨 Step 2: Creating files

FILE: public/index.html
\`\`\`html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Todo App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
\`\`\`

FILE: src/App.tsx
\`\`\`typescript
import React, { useState } from 'react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { id: Date.now(), text: input, completed: false }]);
      setInput('');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Todo App</h1>
      <input 
        value={input} 
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && addTodo()}
        placeholder="Add todo..."
      />
      <button onClick={addTodo}>Add</button>
      
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => {
                setTodos(todos.map(t => 
                  t.id === todo.id ? {...t, completed: !t.completed} : t
                ));
              }}
            />
            <span style={{ 
              textDecoration: todo.completed ? 'line-through' : 'none' 
            }}>
              {todo.text}
            </span>
            <button onClick={() => setTodos(todos.filter(t => t.id !== todo.id))}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
\`\`\`

✅ Todo app created in todo-app/ folder!

Next steps:
1. cd todo-app
2. npm install react react-dom typescript
3. npm start

Remember: Always use COMMAND: and FILE: prefixes for me to execute operations!`;
}