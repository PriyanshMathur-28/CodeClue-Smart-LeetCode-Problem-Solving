// Initialize UI based on current page
document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const isLeetCode = tabs[0]?.url?.includes("leetcode.com");
    document.getElementById(isLeetCode ? "main-ui" : "not-leetcode").style.display = "block";
  });
});

// Store the current problem text globally
let currentProblemText = "";
// Store the original hint to preserve it
let originalHint = "";

// Main hint generation handler
document.getElementById("hint-button").addEventListener("click", async () => {
  const result = document.getElementById("hint-answer");
  result.value = "Loading...";

  try {
    // Get API key
    const { geminiapikey } = await chrome.storage.sync.get(["geminiapikey"]);
    if (!geminiapikey) {
      result.value = "API key missing. Please reinstall extension and add your API key.";
      return;
    }

    // Extract problem content
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const [response] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractProblem
    });

    currentProblemText = response?.result || "No content found.";
    
    // Generate hint using Gemini
    const hint = await generateHint(currentProblemText, geminiapikey);
    result.value = hint;
    
    // Store the original hint
    originalHint = hint;

  } catch (error) {
    result.value = `Error: ${error.message}`;
    originalHint = `Error: ${error.message}`;
  }
});

// Chat functionality
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

// Add message to chat
function addMessage(content, isUser = false) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isUser ? "user-message" : "ai-message"}`;
  messageDiv.textContent = content;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Handle chat input
async function handleChatMessage() {
  const userMessage = chatInput.value.trim();
  if (!userMessage) return;

  // Add user message to chat
  addMessage(userMessage, true);
  chatInput.value = "";
  
  // Disable send button
  sendBtn.disabled = true;
  sendBtn.textContent = "...";

  try {
    // Get API key
    const { geminiapikey } = await chrome.storage.sync.get(["geminiapikey"]);
    if (!geminiapikey) {
      addMessage("API key missing. Please check your extension settings.");
      return;
    }

    // If no problem text is available, try to extract it
    if (!currentProblemText) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const [response] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractProblem
      });
      currentProblemText = response?.result || "No content found.";
    }

    // Generate response using Gemini
    const aiResponse = await generateChatResponse(userMessage, currentProblemText, geminiapikey);
    
    // Add AI response to chat
    addMessage(aiResponse);
    
    // Keep the original hint in the hint section - don't overwrite it
    // Only update if there's no original hint stored
    const hintAnswer = document.getElementById("hint-answer");
    if (!originalHint) {
      hintAnswer.value = aiResponse;
    }

  } catch (error) {
    addMessage(`Error: ${error.message}`);
    // Only update hint section with error if there's no original hint
    if (!originalHint) {
      const hintAnswer = document.getElementById("hint-answer");
      hintAnswer.value = `Error: ${error.message}`;
    }
  } finally {
    // Re-enable send button
    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
  }
}

// Event listeners for chat
sendBtn.addEventListener("click", handleChatMessage);
chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    handleChatMessage();
  }
});

// Extract LeetCode problem content
function extractProblem() {
  const content = [];
  const elements = document.querySelectorAll('div, p, pre, code');
  
  for (const el of elements) {
    const text = el.innerText?.trim();
    if (!text || text.length < 20) continue;
    
    // Skip navigation/ads
    if (el.closest('nav, header, footer, .navbar, .sidebar, .menu')) continue;
    
    // Include problem-related content
    const isProblemContent = /example|input|output|constraint|explanation/i.test(text) ||
                            /problem|description/i.test(el.className);
    
    if (isProblemContent) content.push(text);
  }
  
  return content.join('\n\n') || document.body.innerText.slice(0, 1000);
}

// Generate initial hint using Gemini API
async function generateHint(problemText, apiKey) {
  const text = problemText.length > 12000 ? problemText.slice(0, 12000) + "..." : problemText;
  
  const prompt = `You are an experienced coding mentor helping students learn algorithmic problem-solving.

CONTEXT: This is a LeetCode problem that a student is trying to solve independently.

TASK: Provide a strategic hint that guides thinking without giving away the solution.

PROBLEM:
${text}

REQUIREMENTS:
- Use simple, clear language (explain like I'm a beginner)
- Focus on the key insight or approach, not implementation details
- Structure your response with clear sections
- Keep response under 200 words
- Never provide actual code
- Each main point should be on a new line

FORMAT YOUR RESPONSE AS:
🎯 Key Insight: [What's the main algorithmic concept?]
🔍 Approach: [What strategy should they consider?]
💡 Think About: [What specific aspect should they focus on?]

Remember: Guide their thinking, don't solve it for them.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 400 }
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "API request failed");
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No hint available.";
}

// Generate chat response using Gemini API
async function generateChatResponse(userQuestion, problemText, apiKey) {
  const text = problemText.length > 10000 ? problemText.slice(0, 10000) + "..." : problemText;
  
  const prompt = `You are a supportive coding mentor for LeetCode problems. Your role is to guide students toward solutions through strategic questioning and hints.

PROBLEM CONTEXT:
${text}

STUDENT QUESTION: ${userQuestion}

YOUR GUIDELINES:
- Act as a patient tutor, not a solution provider
- If asked for code: Politely decline and redirect to problem-solving strategies
- Use the Socratic method: Ask guiding questions when appropriate
- Keep responses concise (under 150 words)
- Use encouraging, motivational language
- Structure complex explanations with bullet points or numbered steps

RESPONSE APPROACH:
1. Acknowledge their question
2. Provide strategic guidance or ask a leading question
3. Encourage their problem-solving process
4. End with motivation or next steps

STRICT RULES:
- it should be strictly small to less than 50-60 words
- NEVER provide complete code solutions
- NEVER give step-by-step implementation
- ALWAYS encourage independent thinking
- If they're stuck, break down the problem into smaller parts

Your response:`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.4, 
          maxOutputTokens: 500,
          topK: 40,
          topP: 0.95
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "API request failed");
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";
}
