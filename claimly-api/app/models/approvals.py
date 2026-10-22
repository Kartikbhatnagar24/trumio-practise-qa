from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints

from app.models.claims import STRICT, Money

Comment = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]


class ApproveIn(BaseModel):
    model_config = STRICT

    approved_amount: Money | None = Field(None, description='Amount in INR to approve. Defaults to the full claimed amount.')
    comment: Comment | None = None


class CommentIn(BaseModel):
    model_config = STRICT

    comment: Comment
