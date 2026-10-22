from datetime import date

import pytest
from fastapi.testclient import TestClient

from app.core.clock import get_today
from app.core.config import settings
from app.main import create_app

TODAY = date(2026, 6, 15)


@pytest.fixture
def client_for(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, 'db_path', tmp_path / 'claimly.db')
    monkeypatch.setattr(settings, 'receipts_dir', tmp_path / 'receipts')

    def build(variant=None, bugs=()):
        app = create_app(variant, frozenset(bugs))
        app.dependency_overrides[get_today] = lambda: TODAY
        return TestClient(app)

    return build


@pytest.fixture
def client(client_for):
    return client_for()
