// Store the current problem text globally
let currentProblemText = "";
// Store the original hint to preserve it
let originalHint = "";
// Cache for problem text to avoid re-extraction
let problemTextCache = null;
let cacheTimestamp = 0;
// Bug fix: also cache the tab URL so we invalidate when the user navigates
// to a different LeetCode problem (SPA navigation within 30-second window).
let cachedTabUrl = "";
const CACHE_DURATION = 30000; // 30 seconds

// Utility function to check if cache is valid
function isCacheValid(currentTabUrl) {
  // Invalidate cache if the URL has changed (user navigated to a new problem)
  if (currentTabUrl && currentTabUrl !== cachedTabUrl) {
    return false;
  }
  return problemTextCache && (Date.now() - cacheTimestamp) < CACHE_DURATION;
}

// Debounce function to limit API calls
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Helper: fetch with a timeout so API calls can't hang forever
// Bug fix: without a timeout, a slow/stalled network leaves the UI frozen
// in "Generating..." / "Analyzing..." state indefinitely.
function fetchWithTimeout(url, options, timeoutMs = 15000) {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timerId));
}

// Extract LeetCode problem content with improved error handling
function extractProblem() {
  try {
    const content = [];
    
    // Try to get problem statement from specific LeetCode selectors
    const problemSelectors = [
      '[data-track-load="description_content"]',
      '.content__u3I1',
      '.question-content',
      '.problem-statement',
      '.description__24sA',
      '.elfjS',
      '[data-cy="question-detail-main-tabs"]',
      '.question-detail__JfgR'
    ];
    
    for (const selector of problemSelectors) {
      const element = document.querySelector(selector);
      if (element?.innerText?.trim()) {
        content.push(element.innerText.trim());
        break;
      }
    }
    
    // Fallback: look for elements with problem-related keywords
    if (content.length === 0) {
      const elements = document.querySelectorAll('div, p, pre, code');
      for (const el of elements) {
        const text = el.innerText?.trim();
        if (!text || text.length < 20) continue;

        // Skip navigation/ads
        if (el.closest('nav, header, footer, .navbar, .sidebar, .menu, .navbar__1t4m')) continue;

        // Include problem-related content
        const isProblemContent = /example|input|output|constraint|explanation|given|return|note:/i.test(text) ||
          /problem|description/i.test(el.className) ||
          text.includes('Example') || text.includes('Input:') || text.includes('Output:');

        if (isProblemContent) {
          content.push(text);
        }
      }
    }

    const result = content.join('\n\n');
    // Bug fix: do NOT fall back to body.innerText slice.
    // Returning 1000 chars of random page junk (navbar, sidebar text, etc.)
    // sends garbage to the AI and wastes the user's API quota.
    // Return empty string so getCachedProblemText can throw a clear error.
    return result || "";
  } catch (error) {
    console.error('Error extracting problem:', error);
    return "";
  }
}

// Extract code from LeetCode editor with improved error handling
function extractCodeFromEditor() {
  try {
    // Updated selectors for current LeetCode editor
    const selectors = [
      'textarea[data-keybinding-context*="editor"]',
      '.monaco-editor textarea',
      '.view-lines .view-line',
      '.CodeMirror-code .CodeMirror-line',
      '.inputarea',
      'textarea.inputarea',
      '.monaco-editor .inputarea'
    ];

    // First try to get from textarea elements
    const textareas = document.querySelectorAll('textarea');
    for (const textarea of textareas) {
      if (textarea.value?.trim().length > 10) {
        // Check if it's likely code (contains common programming patterns)
        const code = textarea.value.trim();
        if (/class|function|def|public|private|return|if|for|while|\{|\}|\(|\)/i.test(code)) {
          return code;
        }
      }
    }

    // Try Monaco editor view-lines
    const viewLines = document.querySelector('.view-lines');
    if (viewLines) {
      const lines = viewLines.querySelectorAll('.view-line');
      if (lines.length > 0) {
        const code = Array.from(lines).map(line => line.textContent || '').join('\n');
        if (code.trim().length > 10) {
          return code.trim();
        }
      }
    }

    // Try CodeMirror
    const codeMirror = document.querySelector('.CodeMirror-code');
    if (codeMirror) {
      const lines = codeMirror.querySelectorAll('.CodeMirror-line');
      if (lines.length > 0) {
        const code = Array.from(lines).map(line => line.textContent || '').join('\n');
        if (code.trim().length > 10) {
          return code.trim();
        }
      }
    }

    return '';
  } catch (error) {
    console.error('Error extracting code:', error);
    return '';
  }
}

// Generate initial hint using Gemini API with optimized prompt
async function generateHint(problemText, apiKey) {
  if (!problemText?.trim() || problemText.trim().length < 20) {
    throw new Error("Problem text is too short or empty");
  }

  const text = problemText.length > 8000 ? problemText.slice(0, 8000) + "..." : problemText;
  const prompt = `Provide a concise hint for this LeetCode problem:

${text}

Format:
🎯 Key Insight: [Main concept]
🔍 Approach: [Strategy]
💡 Think About: [Focus point]

Keep under 40-50 strictly and brutally honestly under 40 words words. Guide thinking, don't solve.`;

  // Bug fix: use fetchWithTimeout so a stalled network doesn't freeze the UI
  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.3, 
          maxOutputTokens: 300,
          stopSequences: ["🔚"]
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("API Error:", response.status, errorText);
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  const hint = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!hint) {
    throw new Error("No hint generated from API response");
  }
  
  return hint;
}

// Generate chat response using Gemini API with optimized prompt
async function generateChatResponse(userQuestion, problemText, apiKey) {
  if (!userQuestion?.trim() || !problemText?.trim()) {
    throw new Error("Missing question or problem text");
  }

  const text = problemText.length > 6000 ? problemText.slice(0, 6000) + "..." : problemText;
  const prompt = `As a coding mentor, answer this question about the LeetCode problem:

Problem: ${text}

Question: ${userQuestion}

Rules:
- Keep response under 40 words
- Guide thinking, don't give solutions
- Be encouraging and direct
- Ask leading questions if helpful
The answer you provide should be extremely short and very easy to understand brutally honestly

Response:`;

  // Bug fix: use fetchWithTimeout so a stalled network doesn't freeze the chat
  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 200,
          topK: 20,
          topP: 0.8
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Chat API Error:", response.status, errorText);
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  const chatResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!chatResponse) {
    throw new Error("No response generated from API");
  }
  
  return chatResponse.trim();
}

// Analyze user code using Gemini API with optimized prompt
async function analyzeCode(userCode, problemText, apiKey) {
  if (!userCode?.trim() || !problemText?.trim()) {
    throw new Error("Missing code or problem text");
  }

  const prompt = `Analyze this code for the LeetCode problem:

Problem: ${problemText.slice(0, 4000)}

Code:
${userCode}

Provide:
CORRECTNESS: [0-100]%
FEEDBACK: [Brief analysis with suggestions]

Keep feedback under 200 words. Focus on correctness, efficiency, and improvements.
Give the answer in plain test, no bold headings nothing. Make sure to maintain proper spacing and proper gaps between each new thing introduced.
Do Not give full code instead if give line numbers and errors and tell how to fix threse error and give corrected lines not full code.
No headings/no bold content should be there because * sign come with bold so I dont need bold texts

The answer you provide should be extremely short and very easy to understand brutally honestly
`;

  // Bug fix: use fetchWithTimeout so a stalled network doesn't freeze the UI
  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
          topK: 20,
          topP: 0.8
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Code Analysis API Error:", response.status, errorText);
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  const fullResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!fullResponse) {
    throw new Error("No analysis generated from API");
  }

  // Parse the response to extract correctness percentage and feedback
  const correctnessMatch = fullResponse.match(/CORRECTNESS:\s*(\d+)%/i);

  // Bug fix: parseInt can return NaN if the capture group isn't a pure digit
  // string, which then flows through Math.min/max as NaN and renders "NaN%".
  // Use Number() and explicitly validate; fall back to null to signal "unknown".
  let correctness = null;
  if (correctnessMatch) {
    const parsed = Number(correctnessMatch[1]);
    if (!isNaN(parsed)) {
      correctness = Math.min(Math.max(parsed, 0), 100);
    }
  }

  // Extract feedback (everything after "FEEDBACK:")
  const feedbackMatch = fullResponse.match(/FEEDBACK:\s*([\s\S]*)/i);
  const feedback = feedbackMatch ? feedbackMatch[1].trim() : fullResponse;

  return {
    // null means "could not determine" — caller renders "--%" instead of "0%"
    correctness,
    feedback
  };
}

// Cached problem extraction with error handling
async function getCachedProblemText() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error("No active tab found");
  }

  // Bug fix: pass current tab URL so cache is invalidated when the user
  // navigates to a different LeetCode problem within the 30-second window.
  if (isCacheValid(tab.url)) {
    return problemTextCache;
  }

  try {
    const [response] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractProblem
    });

    const problemText = response?.result || "";
    if (problemText.trim().length < 20) {
      throw new Error("Could not extract problem content. Make sure you are on a LeetCode problem page and the problem has finished loading.");
    }

    problemTextCache = problemText;
    cacheTimestamp = Date.now();
    cachedTabUrl = tab.url || "";
    currentProblemText = problemText;
    
    return problemText;
  } catch (error) {
    console.error("Error getting problem text:", error);
    throw error;
  }
}

// Initialize extension when DOM is loaded
function initializeExtension() {
  // Check if we're on LeetCode
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError) {
      console.error("Error querying tabs:", chrome.runtime.lastError);
      return;
    }
    
    const isLeetCode = tabs[0]?.url?.includes("leetcode.com");
    const mainUI = document.getElementById("main-ui");
    const notLeetcode = document.getElementById("not-leetcode");
    
    if (mainUI && notLeetcode) {
      if (isLeetCode) {
        mainUI.style.display = "block";
        notLeetcode.style.display = "none";
      } else {
        mainUI.style.display = "none";
        notLeetcode.style.display = "block";
      }
    }
  });

  // Toggle between AI Hint and Check My Code modes
  const modeToggle = document.getElementById("mode-toggle");
  const hintMode = document.getElementById("hint-mode");
  const codeCheckMode = document.getElementById("code-check-mode");
  
  if (modeToggle && hintMode && codeCheckMode) {
    modeToggle.addEventListener("click", () => {
      modeToggle.classList.toggle("active");
      if (modeToggle.classList.contains("active")) {
        hintMode.classList.add("hidden");
        codeCheckMode.classList.remove("hidden");
      } else {
        hintMode.classList.remove("hidden");
        codeCheckMode.classList.add("hidden");
      }
    });
  }

  // Main hint generation handler
  const hintButton = document.getElementById("hint-button");
  if (hintButton) {
    hintButton.addEventListener("click", async () => {
      const result = document.getElementById("hint-answer");
      if (!result) return;
      
      // Reset UI state
      result.value = "Loading...";
      hintButton.disabled = true;
      hintButton.textContent = "Generating...";

      try {
        // Get API key
        const storageResult = await chrome.storage.sync.get(["geminiapikey"]);
        const apiKey = storageResult.geminiapikey;
        
        if (!apiKey) {
          throw new Error("API key missing. Please check your extension settings.");
        }

        // Get problem text (cached if available)
        const problemText = await getCachedProblemText();

        // Generate hint using Gemini
        const hint = await generateHint(problemText, apiKey);
        result.value = hint;
        // Bug fix: only update originalHint on success, never on error.
        // Storing an error message as originalHint would corrupt the chat context.
        originalHint = hint;

      } catch (error) {
        console.error("Hint generation error:", error);
        // Provide a more actionable message for timeout errors
        let errorMessage;
        if (error.name === "AbortError") {
          errorMessage = "❌ Request timed out. Please check your internet connection and try again.";
        } else if (error.message.includes("API")) {
          errorMessage = "❌ API Error: Please check your API key and try again.";
        } else {
          errorMessage = `❌ Error: ${error.message}`;
        }
        result.value = errorMessage;
        // Bug fix: do NOT set originalHint to the error message
      } finally {
        hintButton.disabled = false;
        hintButton.textContent = "Get AI Hint";
      }
    });
  }

  // Code Check functionality
  const checkButton = document.getElementById("check-code-button");
  if (checkButton) {
    checkButton.addEventListener("click", async () => {
      const feedbackArea = document.getElementById("code-feedback");
      const correctnessPercentage = document.getElementById("correctness-percentage");
      const progressFill = document.getElementById("progress-fill");
      
      if (!feedbackArea || !correctnessPercentage || !progressFill) return;

      // Reset UI — Bug fix: also reset progress bar COLOR so it doesn't
      // carry over the color from the previous analysis result
      feedbackArea.value = "Analyzing your code...";
      checkButton.disabled = true;
      checkButton.textContent = "Analyzing...";
      correctnessPercentage.textContent = "--%";
      progressFill.style.width = "0%";
      progressFill.style.backgroundColor = ""; // reset to CSS default

      try {
        // Get API key
        const storageResult = await chrome.storage.sync.get(["geminiapikey"]);
        const apiKey = storageResult.geminiapikey;
        
        if (!apiKey) {
          throw new Error("API key missing. Please check your extension settings.");
        }

        // Extract code and get problem content
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) {
          throw new Error("No active tab found");
        }
        
        const [codeResponse] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: extractCodeFromEditor
        });

        const userCode = codeResponse?.result || "";
        if (!userCode.trim()) {
          throw new Error("No code found. Please write some code in the editor first.");
        }

        // Get problem text (cached if available)
        const problemText = await getCachedProblemText();

        // Analyze code using Gemini
        const analysis = await analyzeCode(userCode, problemText, apiKey);

        // Update UI with results
        feedbackArea.value = analysis.feedback;

        // Bug fix: handle null correctness (API didn't return a parseable score)
        if (analysis.correctness === null) {
          correctnessPercentage.textContent = "--%";
          progressFill.style.width = "0%";
        } else {
          correctnessPercentage.textContent = `${analysis.correctness}%`;
          progressFill.style.width = `${analysis.correctness}%`;

          // Update progress bar color based on correctness
          if (analysis.correctness >= 80) {
            progressFill.style.backgroundColor = "#4CAF50"; // Green
          } else if (analysis.correctness >= 60) {
            progressFill.style.backgroundColor = "#FF9800"; // Orange
          } else {
            progressFill.style.backgroundColor = "#F44336"; // Red
          }
        }

      } catch (error) {
        console.error("Code analysis error:", error);
        let errorMessage;
        if (error.name === "AbortError") {
          errorMessage = "❌ Request timed out. Please check your internet connection and try again.";
        } else if (error.message.includes("API")) {
          errorMessage = "❌ API Error: Please check your API key and try again.";
        } else {
          errorMessage = `❌ Error: ${error.message}`;
        }
        feedbackArea.value = errorMessage;
        correctnessPercentage.textContent = "--%";
        progressFill.style.width = "0%";
        progressFill.style.backgroundColor = ""; // reset color on error too
      } finally {
        checkButton.disabled = false;
        checkButton.textContent = "Analyze My Code";
      }
    });
  }

  // Chat functionality
  const chatMessages = document.getElementById("chat-messages");
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");

  // Add message to chat
  function addMessage(content, isUser = false) {
    if (!chatMessages) return;
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${isUser ? "user-message" : "ai-message"}`;
    messageDiv.textContent = content;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Bug fix: debounce was applied to the handler but the send button was only
  // disabled inside the async body. This meant a rapid double-click could
  // fire two concurrent API calls. Now we disable the button synchronously
  // at the top of the debounce wrapper, before any async work starts.
  let isChatPending = false;

  async function handleChat() {
    if (!chatInput || !sendBtn) return;
    if (isChatPending) return; // guard against rapid calls

    const userMessage = chatInput.value.trim();
    if (!userMessage) return;

    // Disable immediately (synchronously) before any await
    isChatPending = true;
    sendBtn.disabled = true;
    sendBtn.textContent = "...";

    // Add user message to chat and clear input
    addMessage(userMessage, true);
    chatInput.value = "";

    try {
      // Get API key
      const storageResult = await chrome.storage.sync.get(["geminiapikey"]);
      const apiKey = storageResult.geminiapikey;
      
      if (!apiKey) {
        throw new Error("API key missing. Please check your extension settings.");
      }

      // Get problem text (cached if available)
      const problemText = await getCachedProblemText();

      // Generate response using Gemini
      const aiResponse = await generateChatResponse(userMessage, problemText, apiKey);

      // Add AI response to chat
      addMessage(aiResponse);

    } catch (error) {
      console.error("Chat error:", error);
      let errorMessage;
      if (error.name === "AbortError") {
        errorMessage = "❌ Request timed out. Please check your internet connection and try again.";
      } else if (error.message.includes("API")) {
        errorMessage = "❌ API Error: Please check your API key and try again.";
      } else {
        errorMessage = `❌ Error: ${error.message}`;
      }
      addMessage(errorMessage);
    } finally {
      // Re-enable send button
      isChatPending = false;
      sendBtn.disabled = false;
      sendBtn.textContent = "Send";
    }
  }

  // Event listeners for chat
  if (sendBtn && chatInput) {
    sendBtn.addEventListener("click", handleChat);
    chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleChat();
      }
    });
  }
}

// Safe DOM operations after content loaded
if (document.readyState === 'loading') {
  document.addEventListener("DOMContentLoaded", initializeExtension);
} else {
  initializeExtension();
}