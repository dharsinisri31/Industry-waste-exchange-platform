import asyncio
import httpx
from main import app

async def run_tests():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver") as client:
        print("\n--- 1. Testing Root Endpoint ---")
        response = await client.get("/")
        print("Root Status:", response.json())
        assert response.status_code == 200
        assert response.json()["status"] == "online"

        print("\n--- 2. Testing /classify Endpoint ---")
        response = await client.post("/classify")
        print("Classify Result:", response.json())
        assert response.status_code == 200
        assert "category" in response.json()

        print("\n--- 3. Testing /recommend Endpoint ---")
        rec_payload = {
            "name": "Fly Ash Heavy Grade",
            "category": "Fly Ash",
            "composition": "Silica 58%, Alumina 24%",
            "quantity": 150.0
        }
        response = await client.post("/recommend", json=rec_payload)
        print("Recommend Top Match:", response.json()["matches"][0]["company_name"])
        print("Recommend Match Score:", response.json()["matches"][0]["score"])
        assert response.status_code == 200
        assert len(response.json()["matches"]) > 0

        print("\n--- 4. Testing /transform Endpoint ---")
        trans_payload = {
            "name": "Plastic Scrap",
            "category": "Plastic Scrap",
            "quantity": 80.0
        }
        response = await client.post("/transform", json=trans_payload)
        print("Transform Primary Product:", response.json()["suggested_products"][0]["name"])
        print("Transform CapEx USD:", response.json()["financial_estimates"]["capex_usd"])
        assert response.status_code == 200
        assert len(response.json()["suggested_products"]) > 0

        print("\n--- 5. Testing /chat (RAG) Endpoint ---")
        chat_payload = {
            "message": "What are the Plastic Waste Management EPR Rules?"
        }
        response = await client.post("/chat", json=chat_payload)
        data = response.json()
        print("Chat Sources:", data.get("sources"))
        print("Chat Reply Snippet:\n", data.get("reply", "")[:180].encode('ascii', errors='replace').decode('ascii'), "...\n")
        assert response.status_code == 200
        assert len(data.get("sources", [])) > 0

        print("\n--- 6. Testing /carbon Endpoint ---")
        carb_payload = {
            "category": "Plastic Scrap",
            "quantity": 1000.0,
            "distance_km": 50.0
        }
        response = await client.post("/carbon", json=carb_payload)
        data = response.json()
        print("Carbon Net Savings:", data["netSavings"], "kg CO2e")
        assert response.status_code == 200
        assert data["netSavings"] > 0

        print("\n=== ALL FASTAPI ENDPOINTS VERIFICATION TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    asyncio.run(run_tests())
