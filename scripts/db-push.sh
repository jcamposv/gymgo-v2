#!/bin/bash

# Database Push Helper
# Usage: ./scripts/db-push.sh [staging|production|both]

ENV_FILE="$(dirname "$0")/../.env.local"

# Read specific variables from .env.local
STAGING=$(grep -E "^SUPABASE_STAGING_REF=" "$ENV_FILE" | cut -d'"' -f2)
PRODUCTION=$(grep -E "^SUPABASE_PRODUCTION_REF=" "$ENV_FILE" | cut -d'"' -f2)

if [ -z "$STAGING" ] || [ -z "$PRODUCTION" ]; then
  echo "❌ Error: SUPABASE_STAGING_REF or SUPABASE_PRODUCTION_REF not set in .env.local"
  exit 1
fi

case "$1" in
  staging|s)
    echo "📦 Pushing to STAGING..."
    supabase link --project-ref $STAGING
    supabase db push
    ;;
  production|prod|p)
    echo "🚀 Pushing to PRODUCTION..."
    supabase link --project-ref $PRODUCTION
    supabase db push
    echo "🔄 Switching back to staging..."
    supabase link --project-ref $STAGING
    ;;
  both|b)
    echo "📦 Pushing to STAGING..."
    supabase link --project-ref $STAGING
    supabase db push
    echo ""
    echo "🚀 Pushing to PRODUCTION..."
    supabase link --project-ref $PRODUCTION
    supabase db push
    echo "🔄 Switching back to staging..."
    supabase link --project-ref $STAGING
    ;;
  *)
    echo "Usage: ./scripts/db-push.sh [staging|production|both]"
    echo "  staging (s)     - Push to staging only"
    echo "  production (p)  - Push to production only"
    echo "  both (b)        - Push to both environments"
    exit 1
    ;;
esac
