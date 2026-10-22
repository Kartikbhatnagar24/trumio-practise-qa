from pydantic import BaseModel, ConfigDict, PositiveInt, ValidationError

from app.static.enums import AmountField, CategoryPicker, ClaimsPath, ColumnOrder, DateField, DateInput, Grade, MerchantField, StepOrder, SubmitLabel


class Strict(BaseModel):
    model_config = ConfigDict(extra='forbid', frozen=True)


class ApiNames(Strict):
    claims_path: ClaimsPath
    amount_field: AmountField
    merchant_field: MerchantField
    date_field: DateField


class Rules(Strict):
    hotel_nightly_limit: PositiveInt
    meal_cap_by_grade: dict[Grade, PositiveInt]
    max_claim_age_days: PositiveInt
    receipt_required_from: PositiveInt
    manager_approval_limit: PositiveInt


class UiOptions(Strict):
    category_picker: CategoryPicker
    date_input: DateInput
    submit_label: SubmitLabel
    column_order: ColumnOrder
    step_order: StepOrder


class Variant(Strict):
    api: ApiNames
    rules: Rules
    ui: UiOptions


DEFAULT_VARIANT = Variant(
    api=ApiNames(claims_path=ClaimsPath.CLAIMS, amount_field=AmountField.AMOUNT, merchant_field=MerchantField.MERCHANT, date_field=DateField.EXPENSE_DATE),
    rules=Rules(
        hotel_nightly_limit=5000,
        meal_cap_by_grade={Grade.G1: 800, Grade.G2: 1200, Grade.G3: 1800},
        max_claim_age_days=60,
        receipt_required_from=2000,
        manager_approval_limit=10000,
    ),
    ui=UiOptions(
        category_picker=CategoryPicker.SELECT,
        date_input=DateInput.CALENDAR,
        submit_label=SubmitLabel.SUBMIT_CLAIM,
        column_order=ColumnOrder.DATE_FIRST,
        step_order=StepOrder.DETAILS_FIRST,
    ),
)


def load_variant(raw: str | None) -> Variant:
    if not raw:
        return DEFAULT_VARIANT
    try:
        variant = Variant.model_validate_json(raw)
    except ValidationError as error:
        fields = ', '.join('.'.join(str(part) for part in item['loc']) for item in error.errors())
        raise ValueError(f'CLAIMLY_VARIANT is invalid at: {fields}') from None
    if set(variant.rules.meal_cap_by_grade) != set(Grade):
        raise ValueError('CLAIMLY_VARIANT is invalid at: rules.meal_cap_by_grade needs every grade')
    return variant
