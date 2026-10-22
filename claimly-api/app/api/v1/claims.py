from typing import Annotated

from fastapi import APIRouter, Query, Response, UploadFile, status

from app.core.clock import Today
from app.core.context import AppContext
from app.core.database import Db
from app.core.security import CurrentUser
from app.models.claims import ClaimFilters
from app.services import claims_service
from app.static.bugs import Bug
from app.static.enums import Role

NOT_FOUND = {404: {'description': 'Claim not found'}}
NOT_EDITABLE = {403: {'description': 'Not the claim owner'}, 409: {'description': 'Claim is not a draft or sent back'}}


def build_router(ctx: AppContext) -> APIRouter:
    models = ctx.models
    router = APIRouter(prefix=f'/{ctx.variant.api.claims_path.value}', tags=['claims'])
    ClaimCreate, ClaimUpdate, Claim = models.create, models.update, models.out

    @router.get('', response_model=models.page)
    def list_claims(user: CurrentUser, conn: Db, filters: Annotated[ClaimFilters, Query()]) -> dict:
        if user.role == Role.FINANCE_ADMIN:
            return claims_service.list_claims(conn, ctx, '1 = 1', [], filters)
        return claims_service.list_claims(conn, ctx, 'claims.employee_id = ?', [user.id], filters)

    @router.post('', response_model=Claim, status_code=status.HTTP_201_CREATED)
    def create_claim(body: ClaimCreate, user: CurrentUser, conn: Db) -> dict:
        claim_id = claims_service.create_claim(conn, user, models.to_canonical(body), ctx.bugs)
        return claims_service.claim_out(conn, ctx, claim_id)

    @router.get('/{claim_id}', response_model=Claim, responses=NOT_FOUND)
    def get_claim(claim_id: int, user: CurrentUser, conn: Db) -> dict:
        claims_service.get_visible(conn, user, claim_id, leak=Bug.OTHER_CLAIM_VISIBLE in ctx.bugs)
        return claims_service.claim_out(conn, ctx, claim_id)

    @router.patch('/{claim_id}', response_model=Claim, responses={**NOT_FOUND, **NOT_EDITABLE})
    def update_claim(claim_id: int, body: ClaimUpdate, user: CurrentUser, conn: Db) -> dict:
        claims_service.update_claim(conn, user, claim_id, models.to_canonical(body, partial=True), ctx.bugs)
        return claims_service.claim_out(conn, ctx, claim_id)

    @router.delete('/{claim_id}', status_code=status.HTTP_204_NO_CONTENT, responses={**NOT_FOUND, **NOT_EDITABLE})
    def delete_claim(claim_id: int, user: CurrentUser, conn: Db) -> Response:
        claims_service.delete_claim(conn, user, claim_id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    @router.post(
        '/{claim_id}/receipt',
        response_model=Claim,
        responses={**NOT_FOUND, **NOT_EDITABLE, 413: {'description': 'File over 5 MB'}, 415: {'description': 'Not a PDF, JPG or PNG'}},
    )
    async def upload_receipt(claim_id: int, file: UploadFile, user: CurrentUser, conn: Db) -> dict:
        await claims_service.attach_receipt(conn, user, claim_id, file)
        return claims_service.claim_out(conn, ctx, claim_id)

    @router.post(
        '/{claim_id}/submit',
        response_model=Claim,
        responses={**NOT_FOUND, **NOT_EDITABLE, 409: {'description': 'Not editable, or a duplicate of another claim'}, 422: {'description': 'Breaks the expense policy'}},
    )
    def submit_claim(claim_id: int, user: CurrentUser, conn: Db, today: Today) -> dict:
        claims_service.submit_claim(conn, ctx, user, claim_id, today)
        return claims_service.claim_out(conn, ctx, claim_id)

    return router
