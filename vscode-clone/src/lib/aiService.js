// AI Providers Configuration
export const AI_PROVIDERS = {
  openai: {
    id: 'openai',
    name: 'OpenAI (GPT-4/3.5)',
    model: 'gpt-3.5-turbo', // Default
    endpoint: 'https://api.openai.com/v1/chat/completions'
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini Pro',
    model: 'gemini-pro',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent'
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter (Claude/Llama)',
    model: 'anthropic/claude-3-haiku', // Default
    endpoint: 'https://openrouter.ai/api/v1/chat/completions'
  }
};

export async function generateAIResponse(providerId, apiKey, messages, activeFile) {
  if (!apiKey) {
    throw new Error('API Key is missing. Please add it in Settings.');
  }

  // Prepare Context (Current File)
  let systemContext = "You are an expert coding assistant inside a VS Code Clone.";
  if (activeFile) {
    systemContext += `\n\nThe user is currently editing this file:\nName: ${activeFile.name}\nLanguage: ${activeFile.language}\nContent:\n\`\`\`\n${activeFile.content}\n\`\`\``;
  }

  const lastMessage = messages[messages.length - 1].content;

  try {
    // --- GOOGLE GEMINI LOGIC ---
    if (providerId === 'gemini') {
      const response = await fetch(`${AI_PROVIDERS.gemini.endpoint}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemContext}\n\nUser Question: ${lastMessage}`
            }]
          }]
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Gemini API Error');
      return data.candidates[0].content.parts[0].text;
    }

    // --- OPENAI / OPENROUTER LOGIC (Compatible APIs) ---
    else {
      const provider = AI_PROVIDERS[providerId];
      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          ...(providerId === 'openrouter' && { 
            'HTTP-Referer': 'https://devstudio.ai', // Required for OpenRouter
            'X-Title': 'DevStudio AI'
          })
        },
        body: JSON.stringify({
          model: provider.model, // Users can change this in settings later
          messages: [
            { role: 'system', content: systemContext },
            ...messages.map(m => ({ role: m.role, content: m.content }))
          ]
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'API Error');
      return data.choices[0].message.content;
    }

  } catch (error) {
    console.error("AI Error:", error);
    throw new Error(error.message);
  }
}