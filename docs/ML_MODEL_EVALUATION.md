# SmartFarm AI – Computer Vision Model Training & Evaluation Report

**Author:** Srishti Anand  
**Model Architecture:** MobileNetV2 (ImageNet Transfer Learning, Two-Stage Fine-Tuning)  
**Model Artifact:** `ml/artifacts/smartfarm_mobilenetv2_v1.keras` (`mobilenetv2-v1.0`)

## 1. Dataset & Stratified Split
- **Source:** PlantVillage Dataset (Filtered to Tomato, Potato, and Bell Pepper)
- **Target Classes:** 15 classes
- **Total Images:** 22,787
- **Stratified Split (Seed 42):**
  - Training Set (70%): 15,950 images (with random flip, rotation, zoom, contrast augmentation)
  - Validation Set (15%): 3,418 images
  - Held-Out Test Set (15%): 3,419 images

## 2. Genuine Held-Out Test Metrics (3,419 Images)
- **Test Accuracy:** `80.37%` (`0.8037`)
- **Macro F1-Score:** `0.7395`
- **Weighted F1-Score:** `0.7923`
- **Detailed Per-Class Report & Confusion Matrix:** Stored in `ml/artifacts/evaluation_report.json` and `ml/artifacts/confusion_matrix.png`.

## 3. Known Limitations
- Trained on laboratory-style PlantVillage images featuring single detached leaves against uniform backgrounds.
- Field photographs with complex backgrounds, uneven lighting, shadows, or multiple overlapping infections may yield lower confidence scores.
- Predictions below `0.60` confidence automatically display an uncertainty warning in the UI.