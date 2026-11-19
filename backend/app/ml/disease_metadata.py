from typing import Dict, List

# Agronomic reference metadata mapped to PlantVillage classes (zero chemical dosage claims)
DISEASE_KNOWLEDGE_MAP: Dict[str, Dict[str, object]] = {
    "Pepper,_bell___Bacterial_spot": {
        "pathogen": "Xanthomonas campestris pv. vesicatoria (Bacterium)",
        "symptoms": "Small water-soaked leaf spots turning dark brown/black with tan centers; premature leaf drop and raised scabby fruit lesions.",
        "recommended_actions": [
            "Avoid overhead sprinkler irrigation to prevent water-splash bacterial spread.",
            "Remove severely infected lower foliage and sanitize pruning tools between rows.",
            "Practice a 2-to-3-year crop rotation away from peppers and tomatoes.",
        ],
    },
    "Pepper,_bell___healthy": {
        "pathogen": "None (Healthy Foliage)",
        "symptoms": "Uniform green leaf coloration without necrotic lesions, curling, or chlorotic halos.",
        "recommended_actions": [
            "Maintain consistent soil moisture and drip irrigation.",
            "Continue weekly scouting of leaf undersides for early pest or disease signs.",
        ],
    },
    "Potato___Early_blight": {
        "pathogen": "Alternaria solani (Fungus)",
        "symptoms": "Dark brown circular lesions with concentric target-board rings on older lower leaves, often surrounded by yellow tissue.",
        "recommended_actions": [
            "Ensure adequate nitrogen and potassium fertility to reduce plant stress.",
            "Rotate out of solanaceous crops for 2 to 3 years and remove crop debris post-harvest.",
            "Irrigate early in the day so foliage dries rapidly.",
        ],
    },
    "Potato___Late_blight": {
        "pathogen": "Phytophthora infestans (Oomycete)",
        "symptoms": "Irregular water-soaked dark green to purplish-black blotches on leaves with white fuzzy growth on humid undersides.",
        "recommended_actions": [
            "Immediately remove and destroy infected foliage/volunteer plants to halt rapid spread.",
            "Hill soil around potato bases to protect developing tubers from spore wash-down.",
            "Consult a local agricultural extension specialist promptly if high humidity persists.",
        ],
    },
    "Potato___healthy": {
        "pathogen": "None (Healthy Foliage)",
        "symptoms": "Vigorous green compound leaves free of water-soaked blotches or concentric lesions.",
        "recommended_actions": [
            "Maintain well-drained soil hilling and balanced irrigation during tuber bulking.",
        ],
    },
    "Tomato___Bacterial_spot": {
        "pathogen": "Xanthomonas spp. (Bacterium)",
        "symptoms": "Small (1–3 mm) dark brown/black water-soaked spots that merge into necrotic patches and cause leaf yellowing.",
        "recommended_actions": [
            "Switch from overhead watering to drip irrigation.",
            "Avoid handling or pruning plants when leaves are wet.",
            "Rotate plots away from tomatoes and peppers for at least two seasons.",
        ],
    },
    "Tomato___Early_blight": {
        "pathogen": "Alternaria solani (Fungus)",
        "symptoms": "Brown-to-black target-ring lesions starting on older bottom leaves accompanied by yellowing halos.",
        "recommended_actions": [
            "Prune infected bottom leaves and apply organic mulch to block soil-splash spores.",
            "Stake plants to maximize airflow through the canopy.",
            "Follow a 2-to-3-year non-solanaceous crop rotation.",
        ],
    },
    "Tomato___Late_blight": {
        "pathogen": "Phytophthora infestans (Oomycete)",
        "symptoms": "Rapidly expanding greasy dark brown/black leaf blotches and stem lesions; white sporulation visible in damp weather.",
        "recommended_actions": [
            "Isolate and remove affected plants immediately; do not compost diseased vines.",
            "Maximize row ventilation and keep foliage dry.",
            "Seek local agronomic extension guidance immediately under cool, humid conditions.",
        ],
    },
    "Tomato___Leaf_Mold": {
        "pathogen": "Passalora fulva (Fungus)",
        "symptoms": "Pale yellow spots on upper leaf surfaces paired with velvety olive-green to grayish-purple mold underneath.",
        "recommended_actions": [
            "Increase greenhouse/polyhouse ventilation and reduce relative humidity below 85%.",
            "Prune lower leaves and water early in the morning.",
        ],
    },
    "Tomato___Septoria_leaf_spot": {
        "pathogen": "Septoria lycopersici (Fungus)",
        "symptoms": "Numerous small circular spots with dark brown margins and light gray/tan centers dotted with tiny black pycnidia.",
        "recommended_actions": [
            "Remove infected lower leaves early and mulch soil surface.",
            "Eliminate nightshade weeds and clean up all plant debris after harvest.",
        ],
    },
    "Tomato___Spider_mites Two-spotted_spider_mite": {
        "pathogen": "Tetranychus urticae (Arachnid Pest)",
        "symptoms": "Fine yellow/white stippling on upper leaves, bronzing, and delicate silk webbing on leaf undersides during hot, dry weather.",
        "recommended_actions": [
            "Inspect leaf undersides with a hand lens and reduce plant drought stress.",
            "Use targeted water sprays on leaf undersides or consult an extension officer for biological/approved miticide options.",
        ],
    },
    "Tomato___Target_Spot": {
        "pathogen": "Corynespora cassiicola (Fungus)",
        "symptoms": "Small water-soaked spots expanding into brown zonate lesions that can cause premature leaf drop.",
        "recommended_actions": [
            "Improve canopy airflow through pruning and proper plant spacing.",
            "Avoid overhead irrigation and rotate crops.",
        ],
    },
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
        "pathogen": "Begomovirus (TYLCV – transmitted by Silverleaf Whitefly)",
        "symptoms": "Severe plant stunting, upward curling/cupping of leaf margins, interveinal yellowing, and flower drop.",
        "recommended_actions": [
            "Rogue (remove and bag) infected plants early to prevent whiteflies from spreading the virus.",
            "Deploy yellow sticky traps and fine insect-proof netting in nurseries.",
        ],
    },
    "Tomato___Tomato_mosaic_virus": {
        "pathogen": "Tobamovirus (ToMV)",
        "symptoms": "Light and dark green mottled mosaic patterns on leaves, leaf distortion, and uneven fruit ripening.",
        "recommended_actions": [
            "Remove infected plants immediately and wash hands/tools thoroughly with soap and water.",
            "Avoid tobacco use near tomato plants and plant virus-resistant varieties.",
        ],
    },
    "Tomato___healthy": {
        "pathogen": "None (Healthy Foliage)",
        "symptoms": "Deep green, fully expanded leaflets without spots, curling, webbing, or mosaic mottling.",
        "recommended_actions": [
            "Continue regular drip irrigation, balanced nutrition, and preventive scouting.",
        ],
    },
}


def get_disease_details(raw_class: str) -> Dict[str, object]:
    if raw_class in DISEASE_KNOWLEDGE_MAP:
        return DISEASE_KNOWLEDGE_MAP[raw_class]
    is_healthy = "healthy" in raw_class.lower()
    return {
        "pathogen": "None (Healthy Foliage)" if is_healthy else "Fungal / Bacterial / Viral Plant Stress",
        "symptoms": "Normal healthy leaf tissue." if is_healthy else "Visible foliar discoloration or lesion pattern detected.",
        "recommended_actions": [
            "Monitor plant progression closely and consult the SmartFarm AI Assistant for crop-specific prevention practices."
        ],
    }