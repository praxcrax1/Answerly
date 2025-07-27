from config import Settings
from tavily import TavilyClient
import trafilatura

settings = Settings()
tavily_client = TavilyClient(api_key=settings.TAVILY_API_KEY)

class SearchService:
    def web_search(self, query: str):
        results = []
        response = tavily_client.search(query=query, max_results=5)
        search_results = response.get('results', [])

        for result in search_results:
            downloaded = trafilatura.fetch_url(result.get('url'))
            content = trafilatura.extract(downloaded, include_comments=False)

            results.append({
                'title': result.get('title', "No Title"),
                'url': result.get('url'),
                'content': content if content else "Content could not be extracted."
            })
            
        return results