"""Fournisseurs d'IA.

``AI_PROVIDER=gemini`` (+ ``GEMINI_API_KEY``) utilise l'API Google Gemini.
Sinon (``local``), ``get_provider()`` renvoie ``None`` et les fonctions de
``text.py`` basculent sur des heuristiques simples : l'application reste
utilisable sans clé ni coût.

Pour ajouter un autre fournisseur, implémenter ``AIProvider.complete``.
"""
from abc import ABC, abstractmethod
from functools import lru_cache

from django.conf import settings


class AIUnavailable(Exception):
    """Levée quand une action exige un fournisseur IA qui n'est pas configuré."""


class AIProvider(ABC):
    @abstractmethod
    def complete(self, system: str, prompt: str, max_tokens: int = 800) -> str:
        """Envoie ``prompt`` au modèle et renvoie sa réponse texte."""


class GeminiProvider(AIProvider):
    """Fournisseur Google Gemini (SDK ``google-genai``).

    Le modèle vient de ``GEMINI_MODEL`` (défaut : ``gemini-2.5-flash``, couvert
    par le tier gratuit — voir https://ai.google.dev/gemini-api/docs/rate-limits).
    """

    def __init__(self, api_key: str, model_name: str, thinking_budget: int):
        from google import genai  # import tardif : la lib n'est requise que si on l'utilise
        from google.genai import types

        self._types = types
        # Configuration globale du client avec un timeout HTTP de 60 secondes pour éviter les interruptions impromptues
        from google.genai.errors import APIError
        self._client = genai.Client(api_key=api_key, http_options={"timeout": 60.0})
        self.model_name = model_name
        # Les modèles 2.5 « réfléchissent » avant de répondre et ces tokens comptent dans
        # max_output_tokens : on les désactive (0) pour des réponses courtes et rapides.
        self._thinking_budget = thinking_budget if model_name.startswith("gemini-2.5") else None

    def complete(self, system, prompt, max_tokens=800):
        from google.genai.errors import APIError
        types = self._types
        config = types.GenerateContentConfig(
            system_instruction=system,
            max_output_tokens=max_tokens,
            temperature=0.3,
            thinking_config=(
                types.ThinkingConfig(thinking_budget=self._thinking_budget)
                if self._thinking_budget is not None else None
            ),
        )
        try:
            response = self._client.models.generate_content(
                model=self.model_name, 
                contents=prompt, 
                config=config
            )
            return response.text or ""
            
        except APIError as exc:
            # Le SDK lève une APIError contenant le code HTTP retourné par Google
            if exc.code == 429:
                raise AIUnavailable("Quota d'API Gemini épuisé ou trop de requêtes simultanées (429).") from exc
            elif exc.code == 503:
                raise AIUnavailable("Les serveurs de Google Gemini sont temporairement indisponibles (503).") from exc
            else:
                raise AIUnavailable(f"Erreur de l'API Gemini ({exc.code}) : {exc.message}") from exc
        except Exception as exc:
            # Sécurité pour toute autre erreur (réseau, coupure de connexion, etc.)
            raise AIUnavailable(f"Erreur de communication inattendue avec l'IA : {str(exc)}") from exc

@lru_cache(maxsize=1)
def get_provider() -> AIProvider | None:
    """Renvoie le fournisseur configuré, ou ``None`` en mode local."""
    if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
        return GeminiProvider(settings.GEMINI_API_KEY, settings.GEMINI_MODEL, settings.GEMINI_THINKING_BUDGET)
    return None
