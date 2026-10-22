from decimal import Decimal

from app.services.money import to_inr_paise
from app.static.enums import Currency


def test_usd_rounds_half_up():
    assert to_inr_paise(Decimal('10.005'), Currency.USD) == 83292


def test_inr_is_identity():
    assert to_inr_paise(Decimal(1), Currency.INR) == 100


def test_one_penny_gbp_rounds_down():
    assert to_inr_paise(Decimal('0.01'), Currency.GBP) == 105
