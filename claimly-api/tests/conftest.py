import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import create_app


@pytest.fixture
def client_for(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, 'db_path', tmp_path / 'claimly.db')
    monkeypatch.setattr(settings, 'receipts_dir', tmp_path / 'receipts')

    def build(variant=None, bugs=()):
        return TestClient(create_app(variant, frozenset(bugs)))

    return build


@pytest.fixture
def client(client_for):
    return client_for()
