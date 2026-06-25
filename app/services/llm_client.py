import json
from typing import Literal
from app.config import settings

Provider = Literal["openai", "gemini", "claude"]

_openai_client = None
_gemini_client = None
_claude_client = None


def _get_openai():
    global _openai_client
    if _openai_client is None:
        from openai import OpenAI
        _openai_client = OpenAI(api_key=settings.openai_api_key)
    return _openai_client


def _get_gemini():
    global _gemini_client
    if _gemini_client is None:
        import google.genai as genai
        _gemini_client = genai.Client(api_key=settings.google_api_key)
    return _gemini_client


def _get_claude():
    global _claude_client
    if _claude_client is None:
        from anthropic import Anthropic
        _claude_client = Anthropic(api_key=settings.anthropic_api_key)
    return _claude_client


def _call_openai(prompt: str, model: str | None = None) -> str:
    client = _get_openai()
    resp = client.chat.completions.create(
        model=model or settings.openai_model,
        messages=[
            {"role": "system", "content": "You return only valid JSON."},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
    )
    return resp.choices[0].message.content


def _call_gemini(prompt: str, model: str | None = None) -> str:
    client = _get_gemini()
    full_prompt = f"You return only valid JSON.\n\n{prompt}"
    resp = client.models.generate_content(
        model=model or settings.gemini_model,
        contents=full_prompt,
        config={"temperature": 0.3},
    )
    return resp.text


def _call_claude(prompt: str, model: str | None = None) -> str:
    client = _get_claude()
    resp = client.messages.create(
        model=model or settings.claude_model,
        max_tokens=4096,
        temperature=0.3,
        system="You return only valid JSON. Never include markdown or extra text.",
        messages=[{"role": "user", "content": prompt}],
    )
    return resp.content[0].text


def llm_call(prompt: str, provider: Provider | None = None) -> str:
    provider = provider or settings.llm_provider
    if provider == "openai":
        return _call_openai(prompt)
    elif provider == "gemini":
        return _call_gemini(prompt)
    elif provider == "claude":
        return _call_claude(prompt)
    raise ValueError(f"Unsupported provider: {provider}")


def parse_json_from_llm(prompt: str, provider: Provider | None = None) -> dict:
    raw = llm_call(prompt, provider)
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1]
        cleaned = cleaned.rsplit("```", 1)[0]
    return json.loads(cleaned)
