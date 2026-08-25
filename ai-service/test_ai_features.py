import sys
import os

# Set stdout encoding to UTF-8 for Windows console support
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add ai-service to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.rag_service import rag_service
from app.services.recommendation_service import recommendation_service
from app.services.transformation_service import transformation_service

def test_rag():
    print("\n--- Testing RAG Chatbot Service ---")
    res = rag_service.query("What are the Fly Ash Utilization Rules 2021?")
    print("Query: Fly Ash Rules")
    print("Sources:", res.get("sources"))
    print("Relevant Rules:", res.get("relevant_rules"))
    reply = res.get("reply", "")
    print("Reply Snippet:\n", reply[:300].encode('ascii', errors='replace').decode('ascii'), "...\n")
    assert len(res.get("sources", [])) > 0, "RAG sources should not be empty"

def test_matching_engine():
    print("\n--- Testing AI Waste Matching Engine ---")
    waste_data = {
        "name": "Fly Ash Heavy Grade",
        "category": "Fly Ash",
        "composition": "Silica 58%, Alumina 24%, LOI 4%",
        "quantity": 200.0,
        "latitude": 12.9716,
        "longitude": 77.5946
    }
    buyers = [
        {
            "id": "1",
            "company_name": "UltraTech Cement Works",
            "industry_type": "Cement Manufacturing",
            "city": "Bangalore",
            "contact_phone": "9876543210",
            "latitude": 12.9800,
            "longitude": 77.6000,
            "needed_waste_types": "Fly Ash, Blast Furnace Slag",
            "description": "High volume pozzolanic cement manufacturer needing fly ash with silica content.",
            "quantity_capacity": 300.0,
            "completed_transactions": 12,
            "rating": 4.9
        },
        {
            "id": "2",
            "company_name": "Tamilnadu Polymer Compounds",
            "industry_type": "Plastic Recycling",
            "city": "Chennai",
            "contact_phone": "9876543211",
            "latitude": 13.0827,
            "longitude": 80.2707,
            "needed_waste_types": "HDPE Scrap, PET Flakes",
            "description": "Processes HDPE scrap into recycled polymer granules.",
            "quantity_capacity": 50.0,
            "completed_transactions": 2,
            "rating": 4.2
        }
    ]

    matches = recommendation_service.match_buyers_for_waste(waste_data, buyers)
    print("Top Recommended Buyer:", matches[0]["company_name"])
    print("Overall Match Score:", matches[0]["score"])
    print("Match Breakdown:", matches[0]["match_breakdown"])
    assert matches[0]["company_name"] == "UltraTech Cement Works", "Cement manufacturer should rank highest for Fly Ash"

def test_transformation_advisor():
    print("\n--- Testing Waste Transformation Advisor ---")
    res = transformation_service.analyze_transformation(
        waste_name="Fly Ash",
        category="Fly Ash",
        composition="Silica 58%, Alumina 24%",
        quantity_tons=100.0
    )
    print("Suggested Primary Product:", res["suggested_products"][0]["name"])
    print("Required Machinery Count:", len(res["required_machinery"]))
    print("CapEx USD:", res["financial_estimates"]["capex_usd"])
    print("Projected ROI %:", res["financial_estimates"]["roi_percentage"])
    print("Carbon Offset (Tons CO2e):", res["carbon_savings"]["total_annual_co2_offset_tons"])
    print("Implementation Steps Count:", len(res["implementation_steps"]))

    assert len(res["suggested_products"]) > 0, "Products list should not be empty"
    assert res["financial_estimates"]["roi_percentage"] > 0, "ROI should be positive"

if __name__ == "__main__":
    print("=== RUNNING VERIFICATION TESTS ===")
    test_rag()
    test_matching_engine()
    test_transformation_advisor()
    print("\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===")
