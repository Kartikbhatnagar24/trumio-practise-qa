import uvicorn

from app import settings

uvicorn.run('app.main:app', host='0.0.0.0', port=settings.PORT, workers=1, proxy_headers=False)
