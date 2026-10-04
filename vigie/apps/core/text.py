"""Outils de traitement de texte partagés (tokenisation, mots vides)."""
import re

STOPWORDS = frozenset("""
le la les un une des de du d l et ou à au aux en dans sur sous par pour avec sans que qui quoi dont où ce cet cette ces
se sa son ses leur leurs est sont été être a ont avoir il elle ils elles nous vous je tu on ne pas plus très aussi mais
donc car si comme fait faire the a an and or of to in on for with without that this these those is are was were be been
has have had it its as at by from but not new nouvelle nouveau nouvelles nouveaux article quelles quel quelle quels
publications publication parlent parle récemment recemment recent latest sur
""".split())

_WORD = re.compile(r"[\w+#]+", re.UNICODE)


def tokenize(text: str, min_len: int = 3) -> list[str]:
    """Découpe ``text`` en mots significatifs (minuscules, sans mots vides)."""
    return [
        w for w in _WORD.findall((text or "").lower())
        if len(w) >= min_len and w not in STOPWORDS and not w.isdigit()
    ]
