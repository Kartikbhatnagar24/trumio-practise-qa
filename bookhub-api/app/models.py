from datetime import date
from typing import Annotated, Literal

from pydantic import BaseModel, Field, StringConstraints, field_validator

Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]


class BookIn(BaseModel):
    title: Text
    author: Text
    isbn: Annotated[str, StringConstraints(pattern=r'^\d{10}(\d{3})?$')]
    category: Text
    price: float = Field(gt=0, le=10000)
    stock: int = Field(ge=0, le=100000)
    rating: float = Field(default=0, ge=0, le=5)
    published_on: date | None = None
    description: Annotated[str, StringConstraints(strip_whitespace=True, max_length=2000)] = ''


class Book(BookIn):
    id: int


class BookPage(BaseModel):
    items: list[Book]
    total: int
    page: int
    page_size: int


class LoginIn(BaseModel):
    email: Annotated[str, StringConstraints(strip_whitespace=True, to_lower=True, min_length=3)]
    password: Annotated[str, StringConstraints(min_length=1)]


class User(BaseModel):
    id: int
    email: str
    name: str
    role: Literal['admin', 'customer']


class LoginOut(BaseModel):
    token: str
    user: User


class OrderItemIn(BaseModel):
    book_id: int
    quantity: int = Field(ge=1, le=99)


class OrderIn(BaseModel):
    customer_name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100)]
    email: Annotated[str, StringConstraints(strip_whitespace=True, pattern=r'^[^@\s]+@[^@\s]+\.[^@\s]+$')]
    address: Annotated[str, StringConstraints(strip_whitespace=True, min_length=5, max_length=300)]
    country: Text
    delivery_date: date
    payment_method: Literal['card', 'cod']
    coupon: Annotated[str, StringConstraints(strip_whitespace=True, to_upper=True)] | None = None
    items: list[OrderItemIn] = Field(min_length=1)

    @field_validator('delivery_date')
    @classmethod
    def not_in_past(cls, value: date) -> date:
        if value < date.today():
            raise ValueError('delivery date cannot be in the past')
        return value


class OrderItem(BaseModel):
    book_id: int
    title: str
    quantity: int
    unit_price: float


class Order(BaseModel):
    id: int
    customer_name: str
    email: str
    address: str
    country: str
    delivery_date: date
    payment_method: str
    coupon: str | None
    subtotal: float
    discount: float
    shipping: float
    total: float
    created_at: str
    items: list[OrderItem]
