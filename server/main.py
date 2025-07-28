
from fastapi import FastAPI, WebSocket
import asyncio
from pydantic_models.chat_body import ChatBody
from services.search_service import SearchService
from services.llm_service import LLMService
from typing import Dict, List

app = FastAPI()
 
search_service = SearchService()
llm_service = LLMService()

# In-memory session state: maps websocket id to conversation history
session_histories: Dict[int, List[dict]] = {}

#chat websocket with session memory
@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()
    ws_id = id(websocket)
    session_histories[ws_id] = []
    try:
        while True:
            await asyncio.sleep(0.1)
            data = await websocket.receive_json()
            query = data.get("query", "")
            if not query:
                await websocket.send_text("Query cannot be empty.")
                continue
            # Perform search
            search_results = search_service.web_search(query)

            await asyncio.sleep(0.1)
            await websocket.send_json({
                "type": "search_results",
                "data": search_results
            })

            # Build conversation history for context
            history = session_histories[ws_id]
            # Add current user query and search results to history
            history.append({
                "query": query,
                "search_results": search_results,
                "response": ""  # Will fill after LLM response
            })

            # Prepare context for LLM: all previous queries, search results, and responses
            context_blocks = []
            for i, turn in enumerate(history):
                context_blocks.append(f"Turn {i+1}:\nUser: {turn['query']}\nSearch Results: {[r['title'] for r in turn['search_results']]}\nAI: {turn['response']}")
            # For the current turn, don't include AI response yet
            context_for_llm = "\n\n".join(context_blocks[:-1]) if len(context_blocks) > 1 else ""

            # Stream LLM response
            response_chunks = []
            for chunk in llm_service.generate_response(query, search_results, context_for_llm):
                await asyncio.sleep(0.1)
                await websocket.send_json({
                    "type": "content",
                    "data": chunk
                })
                response_chunks.append(chunk)
            # Save full response in session history
            history[-1]["response"] = "".join(response_chunks)
    except Exception as e:
        print(f"Error in websocket connection: {e}")
    finally:
        session_histories.pop(ws_id, None)
        await websocket.close()
