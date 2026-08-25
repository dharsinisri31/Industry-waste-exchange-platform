from typing import Dict, Any, List

class CircularEconomyService:
    """
    Circular Economy Pathway Recommender:
    Evaluates industrial waste streams and suggests closed-loop resource recovery pathways (Reuse, Mechanical Recycling, Pelletization, Filament, Construction Aggregate).
    """

    def recommend_pathways(self, waste_name: str, category: str, quantity: float, purity: float) -> Dict[str, Any]:
        cat_lower = category.lower()
        name_lower = waste_name.lower()

        pathways = []
        if "plastic" in cat_lower or "pet" in name_lower or "hdpe" in name_lower:
            pathways.append({
                "pathway": "Mechanical Recycling & Granulation",
                "estimatedRecoveryYield": 92.0,
                "potentialValue": round(quantity * 38.5, 2),
                "potentialCarbonSavingKg": round(quantity * 2.45, 2),
                "processingRequirement": "Washing -> Shredding -> Extrusion",
                "targetIndustries": ["Packaging Manufacturers", "Textile Fiber Plants", "Automotive Parts"]
            })
            pathways.append({
                "pathway": "3D Printing Filament Production",
                "estimatedRecoveryYield": 85.0,
                "potentialValue": round(quantity * 75.0, 2),
                "potentialCarbonSavingKg": round(quantity * 3.10, 2),
                "processingRequirement": "High Purity Sorting -> Filament Extrusion",
                "targetIndustries": ["Additive Manufacturing", "Prototyping Labs"]
            })
        elif "metal" in cat_lower or "steel" in name_lower or "aluminium" in name_lower:
            pathways.append({
                "pathway": "Direct Electric Arc Furnace Smelting",
                "estimatedRecoveryYield": 96.0,
                "potentialValue": round(quantity * 45.0, 2),
                "potentialCarbonSavingKg": round(quantity * 1.85, 2),
                "processingRequirement": "Magnetic Sorting -> Compact Baling",
                "targetIndustries": ["Steel Mills", "Foundries", "Construction Rebar Manufacturers"]
            })
        elif "fly ash" in name_lower or "slag" in name_lower or "construction" in cat_lower:
            pathways.append({
                "pathway": "Green Pozzolanic Concrete & Brick Blending",
                "estimatedRecoveryYield": 98.0,
                "potentialValue": round(quantity * 12.0, 2),
                "potentialCarbonSavingKg": round(quantity * 0.85, 2),
                "processingRequirement": "Particle Size Classification -> Silo Blending",
                "targetIndustries": ["Cement Mills", "Infrastructure & Highway Contractors"]
            })
        else:
            pathways.append({
                "pathway": "Secondary Raw Material Extraction",
                "estimatedRecoveryYield": 80.0,
                "potentialValue": round(quantity * 20.0, 2),
                "potentialCarbonSavingKg": round(quantity * 1.20, 2),
                "processingRequirement": "Thermal / Chemical Treatment",
                "targetIndustries": ["Chemical Processors", "Refining Operations"]
            })

        return {
            "wasteName": waste_name,
            "category": category,
            "circularityIndex": 89.5,
            "recommendedPathways": pathways
        }

circular_economy_service = CircularEconomyService()
