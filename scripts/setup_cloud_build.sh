#!/usr/bin/env bash
set -euo pipefail

# setup_cloud_build.sh
# Automates: create Secret Manager secret, add secret version (from stdin),
# grant Secret Manager access to Cloud Build SA, and create a Cloud Build GitHub trigger.
# Usage: ./scripts/setup_cloud_build.sh

usage(){
  cat <<EOF
Usage: $0
This script will:
  - verify gcloud is installed and authenticated
  - create secret APP_DB_PASSWORD if missing
  - add a secret version (prompts for DB password, reads from stdin)
  - detect a Cloud Build service account and grant it roles/secretmanager.secretAccessor
  - create a GitHub Cloud Build trigger pointing to Administracion/backend/cloudbuild.yaml

You will be prompted for values. The script does NOT store the password in the repo.
EOF
}

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud not found. Install Google Cloud SDK and authenticate before running this script." >&2
  exit 1
fi

echo "Checking gcloud authentication and project..."
ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format='value(account)' || true)
if [ -z "${ACCOUNT}" ]; then
  echo "No active gcloud account. Run: gcloud auth login or gcloud auth activate-service-account --key-file=KEY.json" >&2
  exit 1
fi

PROJECT_ID=$(gcloud config get-value project)
if [ -z "${PROJECT_ID}" ]; then
  echo "No gcloud project configured. Run: gcloud config set project PROJECT_ID" >&2
  exit 1
fi
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')

echo "Project: $PROJECT_ID ($PROJECT_NUMBER)"

read -p "GitHub repo owner (default: JuanDiegoSusunaga): " REPO_OWNER
REPO_OWNER=${REPO_OWNER:-JuanDiegoSusunaga}
read -p "GitHub repo name (default: AppControlArmenia): " REPO_NAME
REPO_NAME=${REPO_NAME:-AppControlArmenia}
read -p "Branch to trigger (default: main): " TRIGGER_BRANCH
TRIGGER_BRANCH=${TRIGGER_BRANCH:-main}
read -p "Trigger name (default: deploy-backend-to-cloud-run): " TRIGGER_NAME
TRIGGER_NAME=${TRIGGER_NAME:-deploy-backend-to-cloud-run}

echo
echo "1) Creating secret 'APP_DB_PASSWORD' if it doesn't exist..."
if gcloud secrets describe APP_DB_PASSWORD >/dev/null 2>&1; then
  echo "Secret APP_DB_PASSWORD already exists"
else
  gcloud secrets create APP_DB_PASSWORD --replication-policy="automatic"
  echo "Created secret APP_DB_PASSWORD"
fi

echo
echo "2) Adding secret version (password will be read securely)."
echo "Provide the DB password when prompted (input hidden)."
read -s -p "DB password: " DBPASS
echo
echo -n "$DBPASS" | gcloud secrets versions add APP_DB_PASSWORD --data-file=-
unset DBPASS
echo "Added secret version to APP_DB_PASSWORD"

echo
echo "3) Detecting Cloud Build service account candidates..."
CANDIDATES=$(gcloud iam service-accounts list --project "$PROJECT_ID" --filter="cloudbuild" --format='value(email)' || true)
if [ -n "$CANDIDATES" ]; then
  echo "Found the following candidate service accounts:" && echo "$CANDIDATES"
fi

SA1="service-${PROJECT_NUMBER}@gcp-sa-cloudbuild.iam.gserviceaccount.com"
SA2="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

CHOICE=""
if gcloud iam service-accounts describe "$SA1" --project="$PROJECT_ID" >/dev/null 2>&1; then
  CHOICE="$SA1"
elif gcloud iam service-accounts describe "$SA2" --project="$PROJECT_ID" >/dev/null 2>&1; then
  CHOICE="$SA2"
elif [ -n "$CANDIDATES" ]; then
  CHOICE=$(echo "$CANDIDATES" | head -n1)
fi

if [ -z "$CHOICE" ]; then
  echo "Could not automatically determine Cloud Build service account. Please pick one from the list above and run:" >&2
  echo "  gcloud secrets add-iam-policy-binding APP_DB_PASSWORD --member=serviceAccount:YOUR_SA_EMAIL --role=roles/secretmanager.secretAccessor"
  exit 1
fi

echo "Granting Secret Manager access to: $CHOICE"
gcloud secrets add-iam-policy-binding APP_DB_PASSWORD \
  --member="serviceAccount:${CHOICE}" \
  --role="roles/secretmanager.secretAccessor"

echo
echo "4) Creating Cloud Build GitHub trigger (leaving _DB_PASS empty to use Secret Manager)..."

gcloud beta builds triggers create github \
  --name="$TRIGGER_NAME" \
  --repo-owner="$REPO_OWNER" \
  --repo-name="$REPO_NAME" \
  --branch-pattern="^${TRIGGER_BRANCH}$" \
  --build-config="Administracion/backend/cloudbuild.yaml" \
  --substitutions=_INSTANCE_CONNECTION_NAME="juan-diego-susunaga:us-central1:controldeobranexus",_DB_USER="app_user",_DB_NAME="controldeobranexus",_USE_PRIVATE_IP="true" || \
  { echo "Trigger creation failed. If your GitHub repository is not connected to Cloud Build via the GitHub App, please create the trigger manually in the Cloud Console."; }

echo
echo "Done. Trigger created (or attempted). If trigger creation failed, follow the Cloud Console steps to create a trigger and leave _DB_PASS empty."

echo "You can now push to $TRIGGER_BRANCH or manually start a build to test. To run a manual build using the trigger config (and Secret Manager), run this locally:"
cat <<EOF
gcloud builds submit --config=Administracion/backend/cloudbuild.yaml \
  --substitutions=_INSTANCE_CONNECTION_NAME="juan-diego-susunaga:us-central1:controldeobranexus",_DB_USER="app_user",_DB_NAME="controldeobranexus",_USE_PRIVATE_IP="true" \
  Administracion/backend
EOF

echo "If you want me to run a manual build from this environment, install and authenticate gcloud here and re-run the script or tell me to proceed."
