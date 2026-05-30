#!/bin/bash
# Set CORS on Firebase Storage bucket for local development

CORS_FILE="cors.json"
BUCKETS=(
  "gs://pehenavas-db.firebasestorage.app"
  "gs://pehenavas-db.appspot.com"
)

if ! command -v gcloud &> /dev/null; then
  echo "  Skipping CORS setup — Google Cloud SDK not installed."
  echo "  Install: brew install --cask google-cloud-sdk"
  echo "  Then: gcloud auth login"
  exit 0
fi

CURRENT_ACCOUNT=$(gcloud auth list --filter=ACTIVE --format="value(account)" 2>/dev/null)
echo "  Authenticated as: $CURRENT_ACCOUNT"

for BUCKET in "${BUCKETS[@]}"; do
  if gcloud storage buckets describe "$BUCKET" &>/dev/null; then
    echo "  Applying CORS to $BUCKET..."
    if gcloud storage buckets update "$BUCKET" --cors-file="$CORS_FILE" 2>/dev/null; then
      echo "  CORS configured successfully!"
      exit 0
    fi
  fi
done

# Fallback: try gsutil
if command -v gsutil &> /dev/null; then
  for BUCKET in "${BUCKETS[@]}"; do
    if gsutil ls "$BUCKET" &>/dev/null 2>&1; then
      echo "  Applying CORS to $BUCKET (via gsutil)..."
      gsutil cors set "$CORS_FILE" "$BUCKET"
      if [ $? -eq 0 ]; then
        echo "  CORS configured successfully!"
        exit 0
      fi
    fi
  done
fi

echo "  Could not find or access the storage bucket."
echo "  Log in with the Firebase project owner account:"
echo "    gcloud auth login"
echo ""
echo "  Or set CORS manually in Google Cloud Console:"
echo "    1. Go to https://console.cloud.google.com/storage/browser"
echo "    2. Select project 'pehenavas-db'"
echo "    3. Find your bucket and go to Configuration > CORS"
echo "    4. Paste the rule from cors.json"
exit 0
