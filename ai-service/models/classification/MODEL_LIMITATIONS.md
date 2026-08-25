# 6-Class Baseline Material Classifier — Model Limitations & Specifications

## Model Identification
- **Architecture**: EfficientNet-B0 Transfer Learning
- **Task**: 6-Class Industrial Waste Visual Classification
- **Classes Supported**: `cardboard`, `glass`, `metal`, `paper`, `plastic`, `trash`
- **Model Checkpoint**: `ai-service/models/classification/material_classifier_efficientnet_b0.pth`

## Critical Scope & Technical Limitations

> [!WARNING]
> **This model is strictly a 6-class baseline classifier.**
>
> 1. **Polymer Sub-Types Not Distinction Capable**:
>    - The model **CANNOT** distinguish between specific plastic resins: `PET`, `HDPE`, `LDPE`, `PP`, `PVC`, `ABS`, `Nylon`, or `Rubber`.
>    - **Policy Enforced**: Generic `plastic` predictions MUST NOT be force-mapped to specific polymer resins like PET or HDPE in API responses or database entries.
>
> 2. **Metal Sub-Types Not Distinction Capable**:
>    - The model **CANNOT** distinguish between specific elemental metals or alloys: `Aluminium`, `Copper`, `Steel`, or `Brass`.
>    - **Policy Enforced**: Generic `metal` predictions MUST NOT be force-mapped to specific metals like Aluminium or Steel.
>
> 3. **Unrepresented Target Material Classes**:
>    - The raw training dataset (`garbage_classification`) does not contain individual ground-truth annotations for:
>      `PET`, `HDPE`, `LDPE`, `PP`, `PVC`, `ABS`, `Nylon`, `Rubber`, `Aluminium`, `Copper`, `Steel`, `Brass`, `Textile`, `Wood`, `E-Waste`, `Organic`.
>
> 4. **Intended Usage**:
>    - Use as a first-pass primary material category identifier (`Cardboard`, `Glass`, `Metal`, `Paper`, `Plastic`, `Trash`). Fine-grained industrial chemical/polymer sorting requires secondary visual inspection models or spectroscopic sensors.
