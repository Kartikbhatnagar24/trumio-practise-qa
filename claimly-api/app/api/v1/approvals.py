from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.core.context import AppContext
from app.core.database import Db
from app.core.security import CurrentUser, require_roles
from app.models.approvals import ApproveIn, CommentIn
from app.models.claims import ClaimFilters
from app.models.users import User
from app.services import approval_service, claims_service
from app.static.enums import ClaimStatus, Role

Reviewer = Annotated[User, Depends(require_roles(Role.MANAGER, Role.FINANCE_ADMIN))]

RESPONSES = {403: {'description': 'Not allowed to act on this claim'}, 404: {'description': 'Claim not found'}, 409: {'description': 'Claim is not at this step'}}


def build_queue_router(ctx: AppContext) -> APIRouter:
    router = APIRouter(tags=['approvals'])

    @router.get('/approvals', response_model=ctx.models.page, responses={403: {'description': 'Only managers and finance have a queue'}})
    def approval_queue(user: Reviewer, conn: Db, filters: Annotated[ClaimFilters, Query()]) -> dict:
        if user.role == Role.MANAGER:
            scope = ('claims.status = ? AND users.manager_id = ?', [ClaimStatus.SUBMITTED.value, user.id])
        else:
            scope = ('claims.status IN (?, ?)', [ClaimStatus.MANAGER_APPROVED.value, ClaimStatus.FINANCE_APPROVED.value])
        return claims_service.list_claims(conn, ctx, *scope, filters)

    return router


def build_router(ctx: AppContext) -> APIRouter:
    router = APIRouter(prefix=f'/{ctx.variant.api.claims_path.value}', tags=['approvals'])
    Claim = ctx.models.out

    @router.post('/{claim_id}/approve', response_model=Claim, responses=RESPONSES)
    def approve(claim_id: int, user: CurrentUser, conn: Db, body: ApproveIn | None = None) -> dict:
        approval_service.approve(conn, ctx, user, claim_id, body or ApproveIn())
        return claims_service.claim_out(conn, ctx, claim_id)

    @router.post('/{claim_id}/send-back', response_model=Claim, responses=RESPONSES)
    def send_back(claim_id: int, body: CommentIn, user: CurrentUser, conn: Db) -> dict:
        approval_service.send_back(conn, user, claim_id, body.comment)
        return claims_service.claim_out(conn, ctx, claim_id)

    @router.post('/{claim_id}/reject', response_model=Claim, responses=RESPONSES)
    def reject(claim_id: int, body: CommentIn, user: CurrentUser, conn: Db) -> dict:
        approval_service.reject(conn, user, claim_id, body.comment)
        return claims_service.claim_out(conn, ctx, claim_id)

    @router.post('/{claim_id}/pay', response_model=Claim, responses=RESPONSES)
    def pay(claim_id: int, user: CurrentUser, conn: Db) -> dict:
        approval_service.pay(conn, ctx, user, claim_id)
        return claims_service.claim_out(conn, ctx, claim_id)

    return router
