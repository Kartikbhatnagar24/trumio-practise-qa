from decimal import ROUND_HALF_UP, Decimal

from app.static.enums import Currency

CENT = Decimal('0.01')
RATES_TO_INR = {Currency.INR: Decimal(1), Currency.USD: Decimal('83.25'), Currency.EUR: Decimal('90.10'), Currency.GBP: Decimal('105.40')}


def to_minor(amount: Decimal) -> int:
    return int(amount.quantize(CENT, ROUND_HALF_UP) * 100)


def from_minor(minor: int | None) -> Decimal | None:
    return None if minor is None else (Decimal(minor) / 100).quantize(CENT)


def to_inr_paise(amount: Decimal, currency: Currency) -> int:
    return to_minor(amount * RATES_TO_INR[currency])
