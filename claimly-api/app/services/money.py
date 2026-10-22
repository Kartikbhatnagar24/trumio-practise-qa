from decimal import ROUND_DOWN, ROUND_HALF_UP, Decimal

from app.static.enums import Currency

CENT = Decimal('0.01')
RATES_TO_INR = {Currency.INR: Decimal(1), Currency.USD: Decimal('83.25'), Currency.EUR: Decimal('90.10'), Currency.GBP: Decimal('105.40')}


def to_minor(amount: Decimal, rounding: str = ROUND_HALF_UP) -> int:
    return int(amount.quantize(CENT, rounding) * 100)


def from_minor(minor: int | None) -> Decimal | None:
    return None if minor is None else (Decimal(minor) / 100).quantize(CENT)


def to_inr_paise(amount: Decimal, currency: Currency, truncate: bool = False) -> int:
    return to_minor(amount * RATES_TO_INR[currency], ROUND_DOWN if truncate else ROUND_HALF_UP)
