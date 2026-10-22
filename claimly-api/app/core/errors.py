from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


def misreport_field(app: FastAPI, field: str, reported_as: str) -> None:
    @app.exception_handler(RequestValidationError)
    async def handler(request: Request, error: RequestValidationError) -> JSONResponse:
        errors = jsonable_encoder(error.errors())
        for item in errors:
            item['loc'] = [reported_as if part == field else part for part in item['loc']]
        return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, content={'detail': errors})
