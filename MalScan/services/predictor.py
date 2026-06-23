import os
import joblib
import pandas as pd
import logging
from MalScan.config import settings

logger = logging.getLogger("malscan.predictor")

class MalwarePredictor:
    def __init__(self):
        self.model = None
        self.feature_columns = None
        self.load_model()

    def load_model(self):
        """Loads pre-trained XGBoost model and feature column layout."""
        try:
            if not settings.MODEL_PATH.exists() or not settings.FEATURE_COLUMNS_PATH.exists():
                logger.warning(
                    f"Model files not found. Expected:\n"
                    f" - Model: {settings.MODEL_PATH}\n"
                    f" - Feature Columns: {settings.FEATURE_COLUMNS_PATH}\n"
                    f"Prediction service will run in heuristic fallback mode."
                )
                return
            
            logger.info(f"Loading XGBoost model from {settings.MODEL_PATH}...")
            self.model = joblib.load(settings.MODEL_PATH)
            
            logger.info(f"Loading feature column order from {settings.FEATURE_COLUMNS_PATH}...")
            self.feature_columns = joblib.load(settings.FEATURE_COLUMNS_PATH)
            logger.info("Model and feature columns loaded successfully.")
        except Exception as e:
            logger.error(f"Error loading model files: {e}. Falling back to heuristic mode.")
            self.model = None
            self.feature_columns = None

    def predict(self, features_dict: dict) -> tuple[str, float]:
        """
        Takes mapped feature dictionary, constructs the DataFrame matching column order,
        runs model prediction, and returns (classification, confidence).
        """
        # Rule-based Heuristic Fallback
        if self.model is None or self.feature_columns is None:
            logger.info("Predicting using static PE mapping heuristics (Fallback mode).")
            # Custom heuristic score based on mapped features
            is_suspicious = (
                features_dict.get("state", 0) == 1 or 
                features_dict.get("static_prio", 120) > 125 or 
                features_dict.get("nivcsw", 0) > 80 or
                features_dict.get("maj_flt", 0) > 0 or
                features_dict.get("exec_vm", 0) > 100
            )
            classification = "malware" if is_suspicious else "benign"
            confidence = 0.88 if is_suspicious else 0.94
            return classification, confidence

        try:
            # Construct pandas DataFrame for inference
            df = pd.DataFrame([features_dict])
            
            # Ensure columns are in the exact order as feature_columns
            df = df[self.feature_columns]
            
            # Run inference
            pred = self.model.predict(df)[0]
            proba = self.model.predict_proba(df)[0]
            
            # Convert prediction to standard types to handle numpy values safely
            try:
                pred_val = int(pred)
                is_numeric = True
            except (ValueError, TypeError):
                pred_val = pred
                is_numeric = False
                
            # Translate prediction values (0/1 or string labels)
            if is_numeric:
                classification = "malware" if pred_val == 1 else "benign"
                confidence = float(proba[1]) if pred_val == 1 else float(proba[0])
            else:
                classification_str = str(pred_val).lower().strip()
                if classification_str in ("1", "malware", "true"):
                    classification = "malware"
                    confidence = float(proba[1]) if len(proba) > 1 else 1.0
                else:
                    classification = "benign"
                    confidence = float(proba[0]) if len(proba) > 0 else 1.0
                
            return classification, confidence
            
        except Exception as e:
            logger.error(f"ML Model prediction failed: {e}. Falling back to heuristics.")
            is_suspicious = features_dict.get("state", 0) == 1
            return "malware" if is_suspicious else "benign", 0.50

# Singleton instance
predictor = MalwarePredictor()
