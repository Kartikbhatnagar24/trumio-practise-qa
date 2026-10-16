COUPONS = {'SAVE10': 0.10}
FREE_SHIPPING_FROM = 50.0
SHIPPING_FEE = 4.99


def compute_totals(lines: list[tuple[float, int]], coupon: str | None) -> dict[str, float]:
    subtotal = round(sum(price * quantity for price, quantity in lines), 2)
    discount = round(subtotal * COUPONS.get(coupon or '', 0), 2)
    shipping = 0.0 if subtotal - discount >= FREE_SHIPPING_FROM else SHIPPING_FEE
    return {'subtotal': subtotal, 'discount': discount, 'shipping': shipping, 'total': round(subtotal - discount + shipping, 2)}
