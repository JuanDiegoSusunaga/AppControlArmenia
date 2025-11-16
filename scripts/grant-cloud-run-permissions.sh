#!/bin/bash
# Script to grant Cloud Run service account permissions to access secrets

PROJECT_ID="controldeobranexus"
REGION="us-central1"
SERVICE_NAME="appcontrolarmenia"
SECRET_NAME="APP_DB_PASSWORD"

echo "🔐 Granting Cloud Run service account permission to access secret..."

# Get the project number (needed for service account)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
CLOUD_RUN_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "Project Number: $PROJECT_NUMBER"
echo "Cloud Run Service Account: $CLOUD_RUN_SA"
echo "Secret Name: $SECRET_NAME"

# Grant the Cloud Run service account permission to access the secret
gcloud secrets add-iam-policy-binding $SECRET_NAME \
  --member="serviceAccount:${CLOUD_RUN_SA}" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID

echo "✅ Secret access granted to Cloud Run service account"

# Also ensure the service has public access
echo ""
echo "🔓 Setting Cloud Run service to allow unauthenticated access..."

gcloud run services add-iam-policy-binding $SERVICE_NAME \
  --region=$REGION \
  --member=allUsers \
  --role=roles/run.invoker \
  --project=$PROJECT_ID

echo "✅ Cloud Run service is now publicly accessible"
echo ""
echo "📝 Next step: Trigger a new Cloud Build by pushing to main"
echo "   git commit --allow-empty -m 'trigger: rebuild after setting permissions'"
echo "   git push origin main"
