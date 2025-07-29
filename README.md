# Answerly

Answerly is a Perplexity AI clone that provides real-time, comprehensive answers to user queries by combining live web search results with advanced AI reasoning.

## Features
- **Real-Time Web Search:** Uses Tavily to fetch up-to-date information from the web for every query.
- **AI-Powered Answers:** Utilizes Google's Gemini LLM to generate concise, informative responses based on the latest web data.
- **Conversational Memory:** Remembers the context of your conversation for more relevant follow-up answers.
- **Modern UI:** Clean, user-friendly interface inspired by Perplexity.

## How It Works
1. **User asks a question** via the web interface.
2. **Tavily** fetches relevant web results in real time.
3. **Gemini LLM** processes the search results and conversation history to generate a high-quality answer.
4. **Answerly** streams the response back to the user, along with the sources used.

## Tech Stack
- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** FastAPI (Python)
- **Web Search:** Tavily API
- **LLM:** Google Gemini

## Getting Started
1. Clone the repo
2. Set up API keys for Tavily and Gemini in the backend config
3. Run the backend (FastAPI server)
4. Run the frontend (Next.js app)

---

*This project is for educational and demonstration purposes only. Not affiliated with Perplexity AI, Google, or Tavily.*
