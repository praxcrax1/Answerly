from fastapi import FastAPI
from fastapi import WebSocket
import asyncio
from pydantic_models.chat_body import ChatBody
from services.search_service import SearchService
from services.llm_service import LLMService

app = FastAPI()
 
search_service = SearchService()
llm_service = LLMService()

#chat websocket
@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await asyncio.sleep(0.1)
            data = await websocket.receive_json()
            query = data.get("query", "")
            if not query:
                await websocket.send_text("Query cannot be empty.")
                continue
            search_results = search_service.web_search(query)

            await asyncio.sleep(0.1)
            await websocket.send_json({
                "type": "search_results",
                "data": search_results
            })

            for chunk in llm_service.generate_response(query, search_results):
                await asyncio.sleep(0.1)
                await websocket.send_json({
                    "type": "content",
                    "data": chunk
                })
    except Exception as e:
        print(f"Error in websocket connection: {e}")
    finally:
        await websocket.close()
