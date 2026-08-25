import math

class TransformationService:
    def __init__(self):
        # Master Knowledge Matrix for Industrial Waste Transformation
        self.transformation_matrix = {
            "Fly Ash": {
                "category": "Industrial Byproduct",
                "products": [
                    {
                        "name": "Geopolymer Eco-Bricks & Concrete Blocks",
                        "grade": "M30 Heavy Structural Grade",
                        "market_value_per_ton": 85.0,
                        "description": "Zero-cement high-strength interlocking pavers and structural wall blocks with superior fire resistance."
                    },
                    {
                        "name": "Pozzolanic Green Cement Additive",
                        "grade": "PPC Standard Grade",
                        "market_value_per_ton": 65.0,
                        "description": "Replaces up to 35% of Ordinary Portland Cement (OPC) in commercial concrete batches."
                    },
                    {
                        "name": "Roller-Compacted Concrete Road Sub-Base",
                        "grade": "IRC Highway Specification",
                        "market_value_per_ton": 45.0,
                        "description": "Heavy-duty road base material for highway embankments and industrial park paving."
                    }
                ],
                "machinery": [
                    {"name": "High-Pressure Hydraulic Brick Press (200 Ton)", "cost_usd": 45000},
                    {"name": "Industrial Batch Mixer & Slurry Homogenizer", "cost_usd": 18000},
                    {"name": "Steam Curing Chamber & Conveyor System", "cost_usd": 22000},
                    {"name": "Pneumatic Ash Silo & Dosing Unit", "cost_usd": 15000}
                ],
                "base_capex": 100000.0,
                "base_opex_per_ton": 22.0,
                "co2_saved_per_ton_kg": 850.0,  # Replaces OPC cement (high carbon footprint)
                "steps": [
                    {"step": 1, "phase": "Material Testing & Sieving", "duration": "Week 1-2", "details": "Analyze unburned carbon content (LOI < 5%) and silica/alumina ratio. Dry sieved to 45 micron mesh."},
                    {"step": 2, "phase": "Alkaline Activator Formulation", "duration": "Week 3-4", "details": "Prepare Sodium Silicate and Sodium Hydroxide (10M) liquid activator solution in a 2.5:1 ratio."},
                    {"step": 3, "phase": "High-Shear Mixing & Slurry Batching", "duration": "Week 5-6", "details": "Combine 70% fly ash, 20% fine aggregate sand, and 10% activator solution in industrial planetary mixer."},
                    {"step": 4, "phase": "Hydraulic Compression & Mold Pressing", "duration": "Week 7-8", "details": "Compress mixture at 25 MPa hydraulic pressure into interlocking brick dimensions."},
                    {"step": 5, "phase": "Thermal Steam Curing & QA Certification", "duration": "Week 9-10", "details": "Cure in 60°C steam chamber for 24 hours to accelerate geopolymerization. Conduct IS-3495 strength test."}
                ]
            },
            "Plastic Scrap": {
                "category": "Polymers",
                "products": [
                    {
                        "name": "High-Density rPET / HDPE Recycled Granules",
                        "grade": "Injection Molding Grade",
                        "market_value_per_ton": 720.0,
                        "description": "Premium uniform polymer pellets for automotive parts, crates, and industrial packaging."
                    },
                    {
                        "name": "Synthetic Composite Eco-Lumber / Planks",
                        "grade": "Outdoor Weather-Resistant Grade",
                        "market_value_per_ton": 550.0,
                        "description": "Zero-rot synthetic timber decking substituting virgin hardwood in municipal park infrastructure."
                    },
                    {
                        "name": "Pyrolysis Synthetic Fuel Oil (Light Crude Equivalent)",
                        "grade": "Industrial Boiler Fuel",
                        "market_value_per_ton": 480.0,
                        "description": "Clean distilled liquid hydro-carbon fuel for industrial burner furnaces."
                    }
                ],
                "machinery": [
                    {"name": "Heavy-Duty Dual-Shaft Plastic Shredder & Granulator", "cost_usd": 32000},
                    {"name": "Friction Wash Plant & Float-Sink Separation Tank", "cost_usd": 28000},
                    {"name": "Twin-Screw Degassing Extruder & Pelletizer", "cost_usd": 65000},
                    {"name": "Continuous Vacuum Pyrolysis Reactor", "cost_usd": 85000}
                ],
                "base_capex": 210000.0,
                "base_opex_per_ton": 140.0,
                "co2_saved_per_ton_kg": 1800.0,
                "steps": [
                    {"step": 1, "phase": "Optical & NIR Sorting", "duration": "Week 1-2", "details": "Sort raw polymer scrap by resin code (PET, HDPE, PP) and remove non-plastic contaminants."},
                    {"step": 2, "phase": "Shredding & Hot Friction Washing", "duration": "Week 3-4", "details": "Shred into 12mm flakes. Wash with caustic soda (80°C) to remove adhesives, oils, and labels."},
                    {"step": 3, "phase": "Density Separation & Centrifugal Drying", "duration": "Week 5-6", "details": "Separate polyolefins (HDPE/PP) from PET via water float-sink tanks. Dry flakes to <1% moisture."},
                    {"step": 4, "phase": "Melt Extrusion & Vacuum Degassing", "duration": "Week 7-8", "details": "Melt flakes at 240°C in twin-screw extruder. Degas volatiles and filter contaminants through 100-mesh screen."},
                    {"step": 5, "phase": "Strand Pelletizing & Quality Control", "duration": "Week 9-10", "details": "Cool extrudate strands in water bath and cut into 3mm uniform pellets. Test Melt Flow Index (MFI)."}
                ]
            },
            "Chemical Containers": {
                "category": "Hazardous Material",
                "products": [
                    {
                        "name": "Decontaminated Steel & HDPE Industrial Drums",
                        "grade": "UN-Certified Hazardous Re-use Grade",
                        "market_value_per_ton": 420.0,
                        "description": "Triple-washed pressure-tested refurbished barrels suitable for chemical transport logistics."
                    },
                    {
                        "name": "Shredded Steel Scrap for Metallurgical Smelting",
                        "grade": "IS-254 Industrial Steel Scrap",
                        "market_value_per_ton": 380.0,
                        "description": "Clean compacted steel scrap feedstock for induction furnace steelmaking."
                    }
                ],
                "machinery": [
                    {"name": "Automatic High-Pressure Solvent Wash System", "cost_usd": 40000},
                    {"name": "Neutralization & Effluent Treatment Plant (ETP)", "cost_usd": 55000},
                    {"name": "Hydraulic Drum Crusher & Steel Baler", "cost_usd": 25000}
                ],
                "base_capex": 120000.0,
                "base_opex_per_ton": 85.0,
                "co2_saved_per_ton_kg": 1450.0,
                "steps": [
                    {"step": 1, "phase": "Hazard Log & Residue Neutralization", "duration": "Week 1", "details": "Inspect drum MSDS codes. Neutralize acid/alkali chemical residues using alkaline wash solution."},
                    {"step": 2, "phase": "Triple Internal Solvent Rinse", "duration": "Week 2", "details": "Subject container interiors to 150-bar high-pressure rotating nozzle solvent jet washing."},
                    {"step": 3, "phase": "Effluent Stream Treatment & Recovery", "duration": "Week 3", "details": "Channel wash liquor to closed-loop ETP plant for chemical precipitation and sludge filtration."},
                    {"step": 4, "phase": "Pneumatic Shot-Blasting & Inspection", "duration": "Week 4", "details": "Shot-blast exterior surfaces to remove rust/paint. Conduct 0.5 bar pneumatic leak tightness test."},
                    {"step": 5, "phase": "Repainting & UN Certification Stamping", "duration": "Week 5", "details": "Apply chemical-resistant epoxy coating and stamp UN approval code for hazardous transport."}
                ]
            },
            "Metal Scrap": {
                "category": "Metallurgy",
                "products": [
                    {
                        "name": "Recycled Steel / Copper Billets",
                        "grade": "Foundry Standard Grade A",
                        "market_value_per_ton": 680.0,
                        "description": "High-purity cast ingots for rebar rolling mills and foundry casting."
                    }
                ],
                "machinery": [
                    {"name": "Induction Melting Furnace (1 Ton/hr)", "cost_usd": 150000},
                    {"name": "Magnetic Separator & Metal Baler", "cost_usd": 35000}
                ],
                "base_capex": 185000.0,
                "base_opex_per_ton": 120.0,
                "co2_saved_per_ton_kg": 1600.0,
                "steps": [
                    {"step": 1, "phase": "Sorting", "duration": "Week 1", "details": "Separate ferrous from non-ferrous using magnetic pulley."},
                    {"step": 2, "phase": "Shearing", "duration": "Week 2", "details": "Cut heavy metal scrap to furnace dimensions."},
                    {"step": 3, "phase": "Smelting", "duration": "Week 3", "details": "Melt in induction furnace at 1550°C."},
                    {"step": 4, "phase": "Refining", "duration": "Week 4", "details": "Deslag and add alloying elements."},
                    {"step": 5, "phase": "Continuous Casting", "duration": "Week 5", "details": "Cast molten metal into billets."}
                ]
            }
        }

        # Default template for unlisted waste types
        self.default_template = {
            "category": "General Waste",
            "products": [
                {
                    "name": "Refuse-Derived Fuel (RDF) Pellets",
                    "grade": "Calorific Value > 4000 kcal/kg",
                    "market_value_per_ton": 110.0,
                    "description": "High-calorific engineered fuel briquettes for industrial boilers and cement kilns."
                },
                {
                    "name": "Organic Soil Conditioner & Bio-Char",
                    "grade": "Agricultural Grade",
                    "market_value_per_ton": 95.0,
                    "description": "Nutrient-rich soil additive promoting moisture retention and carbon sequestration."
                }
            ],
            "machinery": [
                {"name": "Industrial Rotary Shredder & Heavy Screen", "cost_usd": 35000},
                {"name": "Rotary Dryer & Moisture Extractor", "cost_usd": 28000},
                {"name": "High-Pressure Pelletizer / Briquetting Press", "cost_usd": 32000}
            ],
            "base_capex": 95000.0,
            "base_opex_per_ton": 35.0,
            "co2_saved_per_ton_kg": 650.0,
            "steps": [
                {"step": 1, "phase": "Initial Shredding & Material Sorting", "duration": "Week 1-2", "details": "Shred raw waste to <50mm particle size and extract non-combustibles."},
                {"step": 2, "phase": "Thermal Drying & Moisture Control", "duration": "Week 3-4", "details": "Reduce moisture content below 15% using waste-heat rotary dryer."},
                {"step": 3, "phase": "Composition Blending", "duration": "Week 5-6", "details": "Blend biomass and high-energy fractions to achieve target calorific value."},
                {"step": 4, "phase": "Briquetting / Pelletization", "duration": "Week 7-8", "details": "Extrude under high pressure into dense 8mm fuel pellets."},
                {"step": 5, "phase": "Calorific Testing & Packaging", "duration": "Week 9-10", "details": "Verify calorific energy (kcal/kg) and bag for industrial boiler dispatch."}
            ]
        }

    def analyze_transformation(self, waste_name: str, category: str, composition: str, quantity_tons: float) -> dict:
        """
        Calculates financial ROI, machinery requirements, product outputs, carbon offsets, and 5-step roadmap.
        """
        # Lookup waste profile
        matched_key = None
        for key in self.transformation_matrix:
            if key.lower() in waste_name.lower() or key.lower() in category.lower():
                matched_key = key
                break

        profile = self.transformation_matrix[matched_key] if matched_key else self.default_template

        # Scale financial estimates based on annual volume
        qty = max(10.0, float(quantity_tons))
        annual_qty = qty * 12.0  # Assumes monthly batch quantity

        # CapEx & OpEx scaling
        scale_factor = math.pow(annual_qty / 1000.0, 0.6) if annual_qty > 0 else 1.0
        scaled_capex = profile["base_capex"] * scale_factor
        opex_per_ton = profile["base_opex_per_ton"] * max(0.75, 1.0 - (math.log10(max(1, annual_qty)) * 0.05))
        annual_opex = opex_per_ton * annual_qty

        # Financial Revenue & Profit calculation based on primary product
        primary_product = profile["products"][0]
        avg_revenue_per_ton = primary_product["market_value_per_ton"]
        gross_annual_revenue = avg_revenue_per_ton * annual_qty
        net_annual_profit = gross_annual_revenue - annual_opex

        # ROI & Payback period
        roi_percentage = (net_annual_profit / scaled_capex) * 100.0 if scaled_capex > 0 else 45.0
        payback_period_months = (scaled_capex / (net_annual_profit / 12.0)) if net_annual_profit > 0 else 24.0

        # Carbon Savings calculation
        co2_saved_per_ton = profile["co2_saved_per_ton_kg"]
        total_annual_co2_offset = (co2_saved_per_ton * annual_qty) / 1000.0  # Convert kg to metric tons
        green_credits_earned = total_annual_co2_offset / 5.0  # 1 Credit per 5 tons CO2e avoided

        return {
            "waste_input": {
                "name": waste_name,
                "category": category,
                "composition": composition or "Standard Industrial Grade",
                "monthly_quantity_tons": qty,
                "annual_quantity_tons": annual_qty
            },
            "suggested_products": profile["products"],
            "required_machinery": profile["machinery"],
            "financial_estimates": {
                "capex_usd": round(scaled_capex, 2),
                "opex_per_ton_usd": round(opex_per_ton, 2),
                "annual_opex_usd": round(annual_opex, 2),
                "avg_revenue_per_ton_usd": round(avg_revenue_per_ton, 2),
                "gross_annual_revenue_usd": round(gross_annual_revenue, 2),
                "net_annual_profit_usd": round(net_annual_profit, 2),
                "roi_percentage": round(roi_percentage, 1),
                "payback_period_months": round(payback_period_months, 1)
            },
            "carbon_savings": {
                "co2_saved_per_ton_kg": round(co2_saved_per_ton, 1),
                "total_annual_co2_offset_tons": round(total_annual_co2_offset, 1),
                "green_credits_earned": round(green_credits_earned, 1)
            },
            "implementation_steps": profile["steps"]
        }

transformation_service = TransformationService()
