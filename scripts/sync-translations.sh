function extract_keys_fe() {
  local environment=$1
  local language=$2

  jq -r ".clientRegistry.$environment | keys | .[]" "../src/locales/$language/translation.json"
}

function extract_keys_be() {
  local environment=$1
  local language=$2

  jq -r ".$environment | keys | .[]" "../../di-account-management-backend/src/config/clientRegistry.$language.json"
}

function check_keys() {
  local environment=$1
  local language=$2

  local keys_fe=$(extract_keys_fe $environment $language)
  local keys_be=$(extract_keys_be $environment $language)

  echo "Missing in frontend:"
  for key in $keys_be; do
    if [[ ! $keys_fe =~ $key ]]; then
     echo $key
     local value=$(jq ".$environment.[\"$key\"]" ../../di-account-management-backend/src/config/clientRegistry.$language.json)
     echo $value
     jq ".clientRegistry.$environment = .clientRegistry.$environment + { \"$key\": $value }" ../src/locales/$language/translation.json > tmp.$$.json && mv tmp.$$.json "./src/locales/$language/translation.json"
    fi
  done
}

environments=("production" "staging" "integration" "build" "dev" "local")
languages=("en" "cy")

for language in "${languages[@]}"; do
  for environment in "${environments[@]}"; do
    echo "Checking $environment $language"
    check_keys $environment $language
    echo ""
  done
done
