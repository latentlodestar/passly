#!/usr/bin/env bash
set -euo pipefail

# AWS SSO login for day-to-day development work (Developer permission set).
#
# This is NOT used for Terraform. Terraform uses a separate permission set /
# role with broader infrastructure permissions. See infra/ for details.

PROFILE="passly-dev"
SSO_START_URL="https://d-9066006dc1.awsapps.com/start"
SSO_REGION="us-east-1"
ACCOUNT_NAME="passly-sandbox"
PERMISSION_SET="Developer"

# Configure the SSO profile if it doesn't exist yet
if ! aws configure get sso_start_url --profile "$PROFILE" &>/dev/null; then
  echo "Configuring AWS SSO profile: $PROFILE"
  aws configure set sso_start_url "$SSO_START_URL" --profile "$PROFILE"
  aws configure set sso_region "$SSO_REGION" --profile "$PROFILE"
  aws configure set sso_registration_scopes "sso:account:access" --profile "$PROFILE"
  aws configure set region "$SSO_REGION" --profile "$PROFILE"
  aws configure set output "json" --profile "$PROFILE"

  echo ""
  echo "Profile created. On first login you'll need to select:"
  echo "  Account:    $ACCOUNT_NAME"
  echo "  Role:       $PERMISSION_SET"
  echo ""
  echo "After login, run this script again to finalize the profile with your"
  echo "account ID and role name so future logins are fully automatic."
  echo ""
fi

echo "Logging in to AWS SSO (profile: $PROFILE)..."
aws sso login --profile "$PROFILE"

# After a successful login, read back the resolved account/role and persist them
# so subsequent logins don't require manual selection.
ACCOUNT_ID=$(aws configure get sso_account_id --profile "$PROFILE" 2>/dev/null || true)
if [ -z "$ACCOUNT_ID" ]; then
  # Discover account ID and role from the SSO session cache
  ACCESS_TOKEN=$(python3 -c "
import json, glob, os
cache_dir = os.path.expanduser('~/.aws/sso/cache')
files = sorted(glob.glob(os.path.join(cache_dir, '*.json')), key=os.path.getmtime, reverse=True)
for f in files:
    try:
        data = json.load(open(f))
        if 'accessToken' in data:
            print(data['accessToken'])
            break
    except Exception:
        pass
" 2>/dev/null || true)

  if [ -n "$ACCESS_TOKEN" ]; then
    ACCOUNT_ID=$(
      aws sso list-accounts --access-token "$ACCESS_TOKEN" --region "$SSO_REGION" \
        --query "accountList[?accountName=='$ACCOUNT_NAME'].accountId | [0]" --output text 2>/dev/null || true
    )

    if [ -n "$ACCOUNT_ID" ] && [ "$ACCOUNT_ID" != "None" ]; then
      aws configure set sso_account_id "$ACCOUNT_ID" --profile "$PROFILE"
      aws configure set sso_role_name "$PERMISSION_SET" --profile "$PROFILE"
      echo "Saved account $ACCOUNT_ID ($ACCOUNT_NAME) with role $PERMISSION_SET to profile."
    fi
  fi
fi

# Verify credentials work
echo ""
if aws sts get-caller-identity --profile "$PROFILE" &>/dev/null; then
  IDENTITY=$(aws sts get-caller-identity --profile "$PROFILE" --output json)
  echo "Authenticated successfully."
  echo "$IDENTITY" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f\"  Account:  {d['Account']}\")
print(f\"  ARN:      {d['Arn']}\")
"
  echo ""
  echo "Use this profile with:"
  echo "  export AWS_PROFILE=$PROFILE"
  echo ""
  echo "Or pass --profile $PROFILE to individual AWS CLI commands."
else
  echo "Login may have failed — could not verify credentials."
  echo "Try running: aws sso login --profile $PROFILE"
  exit 1
fi
