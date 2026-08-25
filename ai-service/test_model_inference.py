import os
import sys
import json

# Ensure ai-service directory is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.model_loader import model_registry
from app.services.material_service import MaterialClassifierService
from app.services.yolo_service import YOLOService
from app.services.rag_service import rag_service
from app.services.grading_service import grading_service
from app.services.demand_forecasting_service import demand_forecasting_service
from app.services.ocr_service import ocr_service

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "outputs", "inference")

def run_all_inference_tests():
    print("==================================================")
    print("=== STARTING CENTRALIZED MODEL INFERENCE SUITE ===")
    print("==================================================")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    test_results = []
    
    # Locate sample test images
    sample_plastic_img = os.path.join("datasets", "raw", "garbage_classification", "plastic", "plastic1.jpg")
    if not os.path.exists(sample_plastic_img):
        # Fallback to any valid sample image in datasets
        sample_plastic_img = None
        for root, dirs, files in os.walk(os.path.join("datasets", "raw")):
            for f in files:
                if f.lower().endswith(('.jpg', '.png', '.jpeg')):
                    sample_plastic_img = os.path.join(root, f)
                    break
            if sample_plastic_img:
                break

    sample_taco_img = None
    taco_test_dir = os.path.join("datasets", "processed", "detection", "images", "test")
    if os.path.exists(taco_test_dir):
        taco_files = [f for f in os.listdir(taco_test_dir) if f.lower().endswith(('.jpg', '.png'))]
        if taco_files:
            sample_taco_img = os.path.join(taco_test_dir, taco_files[0])

    print(f"Sample Classifier Image : {sample_plastic_img}")
    print(f"Sample Detector Image   : {sample_taco_img}")

    # --- 1. EfficientNet Material Classifier ---
    print("\n--- 1. Testing EfficientNet Material Classifier ---")
    classifier_service = MaterialClassifierService()
    if sample_plastic_img and os.path.exists(sample_plastic_img):
        with open(sample_plastic_img, "rb") as f:
            img_bytes = f.read()
        res_class = classifier_service.classify_image(img_bytes, filename="plastic1.jpg")
        load_status = "SUCCESS" if res_class.get("model_loaded") else "FAILED"
        inf_status = "SUCCESS" if res_class.get("status") == "trained" else "FAILED"
        
        with open(os.path.join(OUTPUT_DIR, "material_classifier_output.json"), "w", encoding="utf-8") as f:
            json.dump(res_class, f, indent=2)

        test_results.append({
            "model": "EfficientNet Material Classifier",
            "file": "material_classifier_efficientnet_b0.pth",
            "load_status": load_status,
            "inference_status": inf_status,
            "input": "Image tensor (224x224 RGB)",
            "output": f"Prediction: {res_class.get('prediction')} (Conf: {res_class.get('confidence')})",
            "errors": res_class.get("error", "None")
        })
    else:
        test_results.append({
            "model": "EfficientNet Material Classifier",
            "file": "material_classifier_efficientnet_b0.pth",
            "load_status": "FAILED",
            "inference_status": "SKIPPED",
            "input": "N/A",
            "output": "N/A",
            "errors": "Sample test image not found"
        })

    # --- 2. YOLO Waste Detector ---
    print("\n--- 2. Testing YOLO Waste Detector ---")
    yolo_service_inst = YOLOService()
    if sample_taco_img and os.path.exists(sample_taco_img):
        with open(sample_taco_img, "rb") as f:
            img_bytes = f.read()
        res_det = yolo_service_inst.detect_objects(img_bytes, filename="taco_test.jpg")
        load_status = "SUCCESS" if res_det.get("model_loaded") else "FAILED"
        inf_status = "SUCCESS" if res_det.get("status") == "success" else "FAILED"

        with open(os.path.join(OUTPUT_DIR, "yolo_detection_output.json"), "w", encoding="utf-8") as f:
            json.dump(res_det, f, indent=2)

        test_results.append({
            "model": "YOLO Waste Detector",
            "file": "best_waste_detector.pt",
            "load_status": load_status,
            "inference_status": inf_status,
            "input": "Image file (320x320 RGB)",
            "output": f"{res_det.get('num_detections')} bounding box detections",
            "errors": res_det.get("error", "None")
        })
    else:
        test_results.append({
            "model": "YOLO Waste Detector",
            "file": "best_waste_detector.pt",
            "load_status": "FAILED",
            "inference_status": "SKIPPED",
            "input": "N/A",
            "output": "N/A",
            "errors": "Sample TACO test image missing"
        })

    # --- 3. YOLO Material Segmentor (Missing Model Check) ---
    print("\n--- 3. Testing YOLO Material Segmentor (Graceful Fallback Check) ---")
    if sample_plastic_img and os.path.exists(sample_plastic_img):
        with open(sample_plastic_img, "rb") as f:
            img_bytes = f.read()
        res_seg = yolo_service_inst.segment_objects(img_bytes, filename="plastic1.jpg")
        
        with open(os.path.join(OUTPUT_DIR, "yolo_segmentation_output.json"), "w", encoding="utf-8") as f:
            json.dump(res_seg, f, indent=2)

        status_str = res_seg.get("status")
        test_results.append({
            "model": "YOLO Material Segmentor",
            "file": "best_segmentation.pt",
            "load_status": "MODEL UNAVAILABLE" if status_str == "model_unavailable" else "LOADED",
            "inference_status": "MODEL UNAVAILABLE" if status_str == "model_unavailable" else "SUCCESS",
            "input": "Image file (RGB)",
            "output": f"status='{status_str}', num_segments={res_seg.get('num_segments')}",
            "errors": res_seg.get("message", "None")
        })

    # --- 4. Price Regressor Model ---
    print("\n--- 4. Testing Price Regressor Model ---")
    price_model = model_registry.load_price_model()
    if price_model is not None:
        try:
            # Predict sample 6-feature vector: [category_encoded, quantity_tons, purity, distance, moisture, demand_index]
            sample_features = [[1.0, 25.0, 90.0, 50.0, 5.0, 1.0]]
            predicted_price = float(price_model.predict(sample_features)[0])
            res_price = {
                "status": "success",
                "predicted_price_usd_per_ton": round(predicted_price, 2),
                "features": {"category": "Plastic Scrap", "quantity_tons": 25.0, "purity": 90.0, "distance_km": 50.0, "moisture": 5.0, "demand_index": 1.0}
            }
            with open(os.path.join(OUTPUT_DIR, "price_model_output.json"), "w", encoding="utf-8") as f:
                json.dump(res_price, f, indent=2)

            test_results.append({
                "model": "Price Regressor",
                "file": "price_rf_model.joblib",
                "load_status": "SUCCESS",
                "inference_status": "SUCCESS",
                "input": "Vector [Category 1.0, 25.0T, 90% purity, 50km, 5% moisture, Index 1.0]",
                "output": f"Predicted Price: ${predicted_price:.2f}/ton",
                "errors": "None"
            })
        except Exception as e:
            test_results.append({
                "model": "Price Regressor",
                "file": "price_rf_model.joblib",
                "load_status": "SUCCESS",
                "inference_status": "FAILED",
                "input": "Vector",
                "output": "N/A",
                "errors": str(e)
            })
    else:
        test_results.append({
            "model": "Price Regressor",
            "file": "price_rf_model.joblib",
            "load_status": "FAILED",
            "inference_status": "FAILED",
            "input": "N/A",
            "output": "N/A",
            "errors": "File missing or failed loading"
        })

    # --- 5. SentenceTransformer Embeddings ---
    print("\n--- 5. Testing SentenceTransformer Embeddings ---")
    embed_model = model_registry.load_embedding_model()
    if embed_model is not None:
        try:
            test_text = "Recycled PET polymer plastic scrap for industrial extrusion"
            vec = embed_model.encode([test_text])[0].tolist()
            res_embed = {
                "status": "success",
                "input_text": test_text,
                "embedding_dimension": len(vec),
                "sample_vector": vec[:5]
            }
            with open(os.path.join(OUTPUT_DIR, "embedding_output.json"), "w", encoding="utf-8") as f:
                json.dump(res_embed, f, indent=2)

            test_results.append({
                "model": "SentenceTransformer Embeddings",
                "file": "all-MiniLM-L6-v2",
                "load_status": "SUCCESS",
                "inference_status": "SUCCESS",
                "input": f"String '{test_text[:30]}...'",
                "output": f"Vector ({len(vec)} dims)",
                "errors": "None"
            })
        except Exception as e:
            test_results.append({
                "model": "SentenceTransformer Embeddings",
                "file": "all-MiniLM-L6-v2",
                "load_status": "SUCCESS",
                "inference_status": "FAILED",
                "input": "String",
                "output": "N/A",
                "errors": str(e)
            })
    else:
        test_results.append({
            "model": "SentenceTransformer Embeddings",
            "file": "all-MiniLM-L6-v2",
            "load_status": "FAILED",
            "inference_status": "FAILED",
            "input": "N/A",
            "output": "N/A",
            "errors": "Model load failed"
        })

    # --- 6. FAISS RAG Index ---
    print("\n--- 6. Testing FAISS RAG Index ---")
    rag_data = model_registry.load_rag_index()
    if rag_data is not None:
        try:
            query = "What are the rules for plastic waste EPR compliance?"
            rag_res = rag_service.query(query)
            with open(os.path.join(OUTPUT_DIR, "rag_output.json"), "w", encoding="utf-8") as f:
                json.dump(rag_res, f, indent=2)

            test_results.append({
                "model": "RAG FAISS Vector Store",
                "file": "FAISS LangChain Store",
                "load_status": "SUCCESS",
                "inference_status": "SUCCESS",
                "input": f"Query '{query}'",
                "output": f"Answer length: {len(rag_res.get('reply', ''))} chars, Sources: {len(rag_res.get('sources', []))}",
                "errors": "None"
            })
        except Exception as e:
            test_results.append({
                "model": "RAG FAISS Vector Store",
                "file": "FAISS LangChain Store",
                "load_status": "SUCCESS",
                "inference_status": "FAILED",
                "input": "Query",
                "output": "N/A",
                "errors": str(e)
            })
    else:
        test_results.append({
            "model": "RAG FAISS Vector Store",
            "file": "FAISS LangChain Store",
            "load_status": "FAILED",
            "inference_status": "FAILED",
            "input": "N/A",
            "output": "N/A",
            "errors": "FAISS vector store missing"
        })

    # --- 7. Damage / Anomaly Model ---
    print("\n--- 7. Testing Damage & Contamination Model ---")
    try:
        sample_metrics = {"material": "plastic", "purity": 88.5, "contamination": 4.2, "moisture": 3.1, "damage": 2.0}
        grade_res = grading_service.calculate_grade(
            material=sample_metrics["material"],
            purity=sample_metrics["purity"],
            contamination=sample_metrics["contamination"],
            moisture=sample_metrics["moisture"],
            damage=sample_metrics["damage"]
        )
        with open(os.path.join(OUTPUT_DIR, "damage_model_output.json"), "w", encoding="utf-8") as f:
            json.dump(grade_res, f, indent=2)

        test_results.append({
            "model": "Damage / Quality Grading Engine",
            "file": "grading_service.py",
            "load_status": "SUCCESS",
            "inference_status": "SUCCESS",
            "input": "Plastic (Purity 88.5%, Contam 4.2%, Damage 2.0%)",
            "output": f"Grade: {grade_res.get('grade')}, Score: {grade_res.get('composite_score')}",
            "errors": "None"
        })
    except Exception as e:
        test_results.append({
            "model": "Damage / Quality Grading Engine",
            "file": "grading_service.py",
            "load_status": "SUCCESS",
            "inference_status": "FAILED",
            "input": "Metrics",
            "output": "N/A",
            "errors": str(e)
        })

    # --- 8. Demand Forecasting Model ---
    print("\n--- 8. Testing Demand Forecasting Model ---")
    try:
        demand_res = demand_forecasting_service.forecast_demand("Plastic Scrap")
        with open(os.path.join(OUTPUT_DIR, "demand_forecast_output.json"), "w", encoding="utf-8") as f:
            json.dump(demand_res, f, indent=2)

        test_results.append({
            "model": "Demand Forecasting Engine",
            "file": "demand_forecasting_service.py",
            "load_status": "SUCCESS",
            "inference_status": "SUCCESS",
            "input": "Category 'Plastic Scrap', 30 Days",
            "output": f"Forecast: {demand_res.get('trend')} trend, Total: {demand_res.get('total_projected_demand')} tons",
            "errors": "None"
        })
    except Exception as e:
        test_results.append({
            "model": "Demand Forecasting Engine",
            "file": "demand_forecasting_service.py",
            "load_status": "SUCCESS",
            "inference_status": "FAILED",
            "input": "Category",
            "output": "N/A",
            "errors": str(e)
        })

    # --- 9. OCR Engine ---
    print("\n--- 9. Testing OCR Engine ---")
    if sample_plastic_img and os.path.exists(sample_plastic_img):
        with open(sample_plastic_img, "rb") as f:
            img_bytes = f.read()
        ocr_res = ocr_service.process_document(img_bytes, filename="plastic1.jpg")
        with open(os.path.join(OUTPUT_DIR, "ocr_output.json"), "w", encoding="utf-8") as f:
            json.dump(ocr_res, f, indent=2)

        test_results.append({
            "model": "OCR Engine",
            "file": "ocr_service.py",
            "load_status": "SUCCESS",
            "inference_status": "SUCCESS",
            "input": "Image bytes",
            "output": f"Extracted Material: {ocr_res.get('extractedFields', {}).get('material')}",
            "errors": "None"
        })
    else:
        test_results.append({
            "model": "OCR Engine",
            "file": "ocr_service.py",
            "load_status": "FAILED",
            "inference_status": "SKIPPED",
            "input": "N/A",
            "output": "N/A",
            "errors": "Sample image missing"
        })

    # Print Summary Report Table
    print("\n\n==========================================================================================")
    print("=== MODEL LOADING & INFERENCE AUDIT SUMMARY TABLE ===")
    print("==========================================================================================")
    print(f"{'MODEL':<32} | {'LOAD STATUS':<18} | {'INFERENCE STATUS':<18} | {'ERRORS'}")
    print("-" * 95)
    for res in test_results:
        print(f"{res['model']:<32} | {res['load_status']:<18} | {res['inference_status']:<18} | {res['errors']}")

    with open(os.path.join(OUTPUT_DIR, "model_inference_audit_summary.json"), "w", encoding="utf-8") as f:
        json.dump(test_results, f, indent=2)

    print(f"\nAudit summary report saved to: {os.path.join(OUTPUT_DIR, 'model_inference_audit_summary.json')}")
    return test_results

if __name__ == "__main__":
    run_all_inference_tests()
