from fastapi import APIRouter, Response, UploadFile, status

from app.core.context import AppContext
from app.core.database import Db
from app.core.security import CurrentUser
from app.services import claims_service

NOT_FOUND = {404: {'description': 'Claim not found'}}
NOT_EDITABLE = {403: {'description': 'Not the claim owner'}, 409: {'description': 'Claim is not a draft or sent back'}}


def build_router(ctx: AppContext) -> APIRouter:
    models = ctx.models
    router = APIRouter(prefix=f'/{ctx.variant.api.claims_path.value}', tags=['claims'])
    ClaimCreate, ClaimUpdate, Claim = models.create, models.update, models.out

    @router.post('', response_model=Claim, status_code=status.HTTP_201_CREATED)
    def create_claim(body: ClaimCreate, user: CurrentUser, conn: Db) -> dict:
        claim_id = claims_service.create_claim(conn, user, models.to_canonical(body))
        return claims_service.claim_out(conn, ctx, claim_id)

    @router.get('/{claim_id}', response_model=Claim, responses=NOT_FOUND)
    def get_claim(claim_id: int, user: CurrentUser, conn: Db) -> dict:
        claims_service.get_visible(conn, user, claim_id)
        return claims_service.claim_out(conn, ctx, claim_id)

    @router.patch('/{claim_id}', response_model=Claim, responses={**NOT_FOUND, **NOT_EDITABLE})
    def update_claim(claim_id: int, body: ClaimUpdate, user: CurrentUser, conn: Db) -> dict:
        claims_service.update_claim(conn, user, claim_id, models.to_canonical(body))
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

    @router.post('/{claim_id}/submit', response_model=Claim, responses={**NOT_FOUND, **NOT_EDITABLE})
    def submit_claim(claim_id: int, user: CurrentUser, conn: Db) -> dict:
        claims_service.submit_claim(conn, ctx, user, claim_id)
        return claims_service.claim_out(conn, ctx, claim_id)

    return router
