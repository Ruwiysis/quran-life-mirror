import httpx
from typing import List, Dict

MCP_BASE = "https://mcp.quran.ai"

async def semantic_search(query: str, limit: int = 5) -> List[Dict]:
    """Search Quran by semantic meaning using Quran Foundation MCP."""
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            f"{MCP_BASE}/search",
            json={"query": query, "limit": limit, "language": "en"},
        )
        response.raise_for_status()
        data = response.json()
        results = data.get("results", [])
        # Filter by relevance — keep quality matches only
        return [r for r in results if r.get("score", 0) > 0.60]
