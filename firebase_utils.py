
"""
Firebase Storage Integration
Uploads generated graphs to Firebase Storage and returns public URLs.
"""
import os
import firebase_admin
from firebase_admin import credentials, storage
from datetime import datetime
import uuid

# Initialize Firebase App
# We check if app is already initialized to avoid errors on reload
import json

# Initialize Firebase App
# We check if app is already initialized to avoid errors on reload
if not firebase_admin._apps:
    bucket_name = os.getenv("FIREBASE_STORAGE_BUCKET")
    cred = None
    
    # Priority 1: Credential JSON string in env var (for Cloud deployment)
    json_creds = os.getenv("FIREBASE_CREDENTIALS_JSON")
    if json_creds:
        try:
            cred_dict = json.loads(json_creds)
            cred = credentials.Certificate(cred_dict)
            print("Loaded Firebase credentials from environment variable.")
        except Exception as e:
            print(f"Error parsing FIREBASE_CREDENTIALS_JSON: {e}")

    # Priority 2: Local file (for local dev)
    if not cred:
        cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "firebase-credentials.json")
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            print(f"Loaded Firebase credentials from file: {cred_path}")
    
    if cred and bucket_name:
        firebase_admin.initialize_app(cred, {
            'storageBucket': bucket_name
        })
        print("Firebase Admin SDK initialized successfully.")
    else:
        print("Warning: Firebase credentials or bucket name not found. Graph uploads will fail.")

def upload_graph(file_path: str) -> str | None:
    """
    Upload a local image file to Firebase Storage and return its public URL.
    Returns None if upload fails or Firebase is not configured.
    """
    if not firebase_admin._apps:
        print("Error: Firebase not initialized. Cannot upload graph.")
        return None
        
    try:
        bucket = storage.bucket()
        
        # Create a unique filename for cloud storage
        # structure: graphs/{date}/{uuid}.png
        date_str = datetime.now().strftime("%Y-%m-%d")
        unique_id = uuid.uuid4().hex
        blob_name = f"graphs/{date_str}/{unique_id}.png"
        
        blob = bucket.blob(blob_name)
        blob.upload_from_filename(file_path)
        
        # Make public and get URL
        blob.make_public()
        
        print(f"Graph uploaded to Firebase: {blob.public_url}")
        return blob.public_url
        
    except Exception as e:
        print(f"Failed to upload graph to Firebase: {e}")
        return None
