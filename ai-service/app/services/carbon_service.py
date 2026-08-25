carbon_coefficients = {
    'Plastic Scrap': 1.5,
    'Metal Scrap': 2.0,
    'Fly Ash': 0.8,
    'Glass': 1.2,
    'Textile Waste': 1.0,
    'Food Waste': 0.5,
    'Chemical Containers': 1.4,
    'Electronic Waste': 2.5,
    'Other': 0.7
}

# Transport emissions coefficient: 0.15 kg CO2 per ton-km
TRANSPORT_COEFFICIENT = 0.15

class CarbonService:
    def calculate_savings(self, category: str, quantity_kg: float, distance_km: float = 20.0) -> dict:
        coefficient = carbon_coefficients.get(category, carbon_coefficients['Other'])
        
        # Reuse offset (kg CO2)
        reuse_offset = quantity_kg * coefficient
        
        # Convert quantity to tons for transportation emissions formula
        quantity_tons = quantity_kg / 1000.0
        
        # Transport emissions (kg CO2)
        transport_emissions = distance_km * quantity_tons * TRANSPORT_COEFFICIENT
        
        # Net balance (minimum 0)
        net_savings = max(0.0, reuse_offset - transport_emissions)
        
        return {
            "totalCarbonSaved": round(reuse_offset, 2),
            "transportEmissions": round(transport_emissions, 2),
            "netSavings": round(net_savings, 2),
            "greenCreditsEarned": round(net_savings / 500.0, 2)
        }

carbon_service = CarbonService()
