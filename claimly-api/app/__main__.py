import uvicorn

from app.core.config import settings

uvicorn.run('app.main:create_app_from_settings', factory=True, host='0.0.0.0', port=settings.port, workers=1)
