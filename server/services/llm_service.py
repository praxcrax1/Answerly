from google import genai
from google.genai import types
from config import Settings

settings = Settings()

class LLMService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model = "gemini-2.5-flash"

    def generate_response(self, query: str, search_results: list[dict], session_context: str = ""):
        context = "\n\n".join(
            [
                f"Source {i+1}:\nTitle: {result['title']}\nURL: {result['url']}\nContent: {result['content']}"
                for i, result in enumerate(search_results)
            ]
        )

        prompt = (
            "You are a helpful assistant. Use the following context and conversation history to answer the user's query.\n"
            "Think and reason deeply and ensure it answers the user query. Do not use your own knowledge until it is necessary.\n"
            "CONVERSATION HISTORY (previous turns):\n"
            f"{session_context}\n"
            "CONTEXT FROM SEARCH RESULTS (current turn):\n"
            f"{context}\n"
            "USER QUERY (current turn):\n"
            f"{query}\n"
            "Please provide a concise and informative response based on the context provided."
            "Use Markdown for formatting if necessary with proper headings, bullet points, and code blocks."
        )

        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=prompt)],
            ),
        ]

        generate_content_config = types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_budget=-1),
        )

        for chunk in self.client.models.generate_content_stream(
            model=self.model,
            contents=contents,
            config=generate_content_config,
        ):
            if hasattr(chunk, "text") and chunk.text:
                yield chunk.text
        