from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, create_model

from app.core.variant import ApiNames
from app.static.enums import Category, ClaimStatus, Currency

Money = Annotated[Decimal, Field(gt=0, max_digits=12, decimal_places=2)]
Merchant = Annotated[str, Field(min_length=1, max_length=120)]
Description = Annotated[str, Field(max_length=500)]
Nights = Annotated[int, Field(ge=1, le=60)]
STRICT = ConfigDict(extra='forbid')


class Receipt(BaseModel):
    filename: str
    size: int
    content_type: str


class PersonRef(BaseModel):
    id: str
    name: str


class ClaimEvent(BaseModel):
    actor: PersonRef
    action: str
    from_status: ClaimStatus | None
    to_status: ClaimStatus
    comment: str | None
    amount_inr: Decimal | None
    at: str


class Project(BaseModel):
    id: str
    code: str
    name: str


@dataclass(frozen=True)
class ClaimModels:
    create: type[BaseModel]
    update: type[BaseModel]
    out: type[BaseModel]
    names: dict[str, str]

    def to_canonical(self, payload: BaseModel, partial: bool = False) -> dict:
        variant_to_canonical = {name: canonical for canonical, name in self.names.items()}
        return {variant_to_canonical.get(key, key): value for key, value in payload.model_dump(exclude_unset=partial).items()}

    def to_variant(self, claim: dict) -> dict:
        return {self.names.get(key, key): value for key, value in claim.items()}


def build_claim_models(api: ApiNames) -> ClaimModels:
    names = {'amount': api.amount_field.value, 'merchant': api.merchant_field.value, 'expense_date': api.date_field.value}
    create = create_model(
        'ClaimCreate',
        __config__=STRICT,
        category=(Category, ...),
        currency=(Currency, Currency.INR),
        description=(Description, ''),
        project_id=(str | None, None),
        nights=(Nights | None, None),
        **{names['amount']: (Money, ...), names['merchant']: (Merchant, ...), names['expense_date']: (date, ...)},
    )
    update = create_model(
        'ClaimUpdate',
        __config__=STRICT,
        category=(Category | None, None),
        currency=(Currency | None, None),
        description=(Description | None, None),
        project_id=(str | None, None),
        nights=(Nights | None, None),
        **{names['amount']: (Money | None, None), names['merchant']: (Merchant | None, None), names['expense_date']: (date | None, None)},
    )
    out = create_model(
        'Claim',
        id=(int, ...),
        status=(ClaimStatus, ...),
        category=(Category, ...),
        currency=(Currency, ...),
        description=(str, ...),
        project=(Project | None, ...),
        nights=(int | None, ...),
        amount_inr=(Decimal, ...),
        approved_amount_inr=(Decimal | None, ...),
        receipt=(Receipt | None, ...),
        employee=(PersonRef, ...),
        created_at=(str, ...),
        submitted_at=(str | None, ...),
        events=(list[ClaimEvent], ...),
        **{names['amount']: (Decimal, ...), names['merchant']: (str, ...), names['expense_date']: (date, ...)},
    )
    return ClaimModels(create=create, update=update, out=out, names=names)
