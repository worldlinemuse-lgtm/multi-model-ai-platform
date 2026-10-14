// Descriptive setup steps derived from immutable A2.6 free_key_registry.json; no credentials or API calls.
window.MM_PROVIDER_GUIDES = Object.freeze([
  {
    "id": "groq",
    "name": "GroqCloud",
    "scope": "Organization or project, as reported by the account console",
    "reset": "Different quota windows; response headers report remaining daily requests and minute tokens.",
    "note": "Daily-request and minute-token counters are distinct; a free plan does not imply unlimited context.",
    "steps": [
      "Create a free GroqCloud account and sign in.",
      "Stay on the Free plan. Do not upgrade to Developer.",
      "Open API Keys, choose the intended project, create a new key, and copy it securely.",
      "Check your current Free limits in the console; they are shared within the applicable project/organization.",
      "Select an eligible active model such as openai/gpt-oss-20b after checking your account's Free limits. Llama 3.1 8B and Llama 3.3 70B were retired for Free and Developer tiers on Aug 16, 2026.",
      "Return to the platform and save the key into the encrypted vault; the opt-in metadata diagnostic verifies model listing but not chat inference."
    ],
    "signup_url": "https://console.groq.com/",
    "key_url": "https://console.groq.com/keys",
    "docs_url": "https://console.groq.com/docs/quickstart",
    "limits_url": "https://console.groq.com/docs/rate-limits"
  },
  {
    "id": "openrouter",
    "name": "OpenRouter Free",
    "scope": "OpenRouter account; multiple keys do not multiply free capacity",
    "reset": "Daily; exact account remaining may be reported by GET /api/v1/key.",
    "note": "Free models may have upstream availability limits. Paid fallback and chargeable auto-routing are prohibited.",
    "steps": [
      "Create or sign into an OpenRouter free account.",
      "Open the API Keys page and create a new key.",
      "Do not add funds or select the paid model catalog.",
      "Select only model IDs explicitly ending in :free; a model family may have paid variants.",
      "Check your free-model daily request allowance in account information, then return to connect securely."
    ],
    "signup_url": "https://openrouter.ai/",
    "key_url": "https://openrouter.ai/settings/keys",
    "docs_url": "https://openrouter.ai/docs",
    "limits_url": "https://openrouter.ai/pricing"
  },
  {
    "id": "gemini",
    "name": "Google Gemini API",
    "scope": "Google AI Studio project, not individual API key",
    "reset": "Daily request quotas reset at midnight Pacific time; shorter windows vary.",
    "note": "Free-tier Gemini data may be used to improve Google products. A billing-enabled project requires separate review and is not automatically eligible.",
    "steps": [
      "Sign in to Google AI Studio with your Google account.",
      "Create or choose a project that remains on the Free tier and has no paid billing account linked.",
      "Open API Keys and generate a key for that free project.",
      "Inspect the project quota page and verify each desired model is Free-tier eligible.",
      "Return to the platform for future local secure connection."
    ],
    "signup_url": "https://aistudio.google.com/",
    "key_url": "https://aistudio.google.com/api-keys",
    "docs_url": "https://ai.google.dev/gemini-api/docs/api-key",
    "limits_url": "https://ai.google.dev/gemini-api/docs/rate-limits"
  },
  {
    "id": "cloudflare",
    "name": "Cloudflare Workers AI",
    "scope": "Cloudflare account and Workers plan",
    "reset": "Daily at 00:00 UTC.",
    "note": "Some Workers AI models require Paid even when other models are free; do not enable Workers Paid or prepaid AI Gateway billing.",
    "steps": [
      "Create a Cloudflare account using the Workers Free plan.",
      "Open Workers AI and choose Use REST API.",
      "Create a Workers AI API token using the recommended permissions.",
      "Copy the Account ID too; this provider requires both values.",
      "Verify that the exact model is eligible for Workers Free and is not a paid-only model.",
      "Return for future secure key and Account ID connection."
    ],
    "signup_url": "https://dash.cloudflare.com/sign-up",
    "key_url": "https://dash.cloudflare.com/",
    "docs_url": "https://developers.cloudflare.com/workers-ai/get-started/rest-api/",
    "limits_url": "https://developers.cloudflare.com/workers-ai/platform/pricing/"
  },
  {
    "id": "mistral",
    "name": "Mistral Studio Free",
    "scope": "Mistral workspace / account",
    "reset": "Rate-window limits recur; reset schedule and numerical allowance are account-specific.",
    "note": "The provider does not publish one universal free quota; do not present invented remaining usage.",
    "steps": [
      "Create or sign into Mistral Studio.",
      "Confirm Studio is in Free mode; official quickstart says no credit card is needed.",
      "Open API Keys, create a key and set an expiration date if appropriate.",
      "Review model availability and rate limits for your account without upgrading.",
      "Return to the platform for future local secure connection."
    ],
    "signup_url": "https://console.mistral.ai/",
    "key_url": "https://console.mistral.ai/",
    "docs_url": "https://docs.mistral.ai/getting-started/quickstarts/studio/activate-and-generate-api-key",
    "limits_url": "https://docs.mistral.ai/getting-started/quickstarts/studio/activate-and-generate-api-key"
  },
  {
    "id": "ollama",
    "name": "Ollama Cloud Free",
    "scope": "Ollama account, only free starter-model usage",
    "reset": "Monthly on the account signup anniversary; unused included amount does not roll over.",
    "note": "A free account can buy credits; the platform must never treat purchase-accessible models as free.",
    "steps": [
      "Sign up for the Ollama Free plan and sign in.",
      "Open account settings to generate an API key.",
      "Review which starter models are included; other models may cost credits.",
      "Do not purchase credits or enable paid usage.",
      "Return to the platform for future key connection and starter-model allowlist."
    ],
    "signup_url": "https://ollama.com/",
    "key_url": "https://ollama.com/settings/keys",
    "docs_url": "https://ollama.com/blog/transparent-pricing",
    "limits_url": "https://ollama.com/pricing"
  },
  {
    "id": "huggingface",
    "name": "Hugging Face Inference Providers",
    "scope": "Hugging Face account for routed inference; NOT external provider BYOK",
    "reset": "Monthly included credits; exact reset date visible in account billing.",
    "note": "Monthly credits are recurring, not a one-off signup trial. They are very small; no request should continue beyond the included free allowance.",
    "steps": [
      "Sign up for a free Hugging Face account.",
      "Open Access Tokens, create a token with only the needed Inference Providers permissions.",
      "Use Hugging Face routed inference, not a custom provider key; monthly included credits only apply to routed usage.",
      "Do not purchase credits or activate pay-as-you-go billing.",
      "Return for a future connection after spending/eligibility controls are independently verified."
    ],
    "signup_url": "https://huggingface.co/join",
    "key_url": "https://huggingface.co/settings/tokens",
    "docs_url": "https://huggingface.co/docs/inference-providers/pricing",
    "limits_url": "https://huggingface.co/docs/inference-providers/pricing"
  },
  {
    "id": "aion",
    "name": "Aion Labs Free",
    "scope": "Aion Labs account; default Free tier",
    "reset": "Daily token allowance; published timezone is unspecified.",
    "note": "Free API usage is an ongoing courtesy and may be changed by the provider; display account-specific balance as unknown until measured.",
    "steps": [
      "Sign up for a free Aion Labs account; no card is required.",
      "Remain on the default Free tier; do not top up credits.",
      "Open your account dashboard and create an API key.",
      "Review the published request and token limits and your daily credit allowance.",
      "Return to the platform for future secure key connection."
    ],
    "signup_url": "https://www.aionlabs.ai/accounts/signup/",
    "key_url": "https://www.aionlabs.ai/accounts/signup/",
    "docs_url": "https://www.aionlabs.ai/docs/quickstart/",
    "limits_url": "https://www.aionlabs.ai/docs/rate-limits/"
  }
]);
