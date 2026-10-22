from dataclasses import dataclass

from app.core.variant import Variant
from app.models.claims import ClaimModels, build_claim_models
from app.static.bugs import Bug


@dataclass(frozen=True)
class AppContext:
    variant: Variant
    bugs: frozenset[Bug]
    models: ClaimModels


def build_context(variant: Variant, bugs: frozenset[Bug]) -> AppContext:
    return AppContext(variant=variant, bugs=bugs, models=build_claim_models(variant.api))
