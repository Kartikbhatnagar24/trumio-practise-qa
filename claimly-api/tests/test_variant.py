import json

import pytest

from app.core.config import settings
from app.core.variant import DEFAULT_VARIANT, load_variant
from app.main import create_app_from_settings
from app.static.bugs import UI_BUG_CODES, parse_bugs
from tests.helpers import FULL_ALTERNATE


def test_default_when_unset():
    assert load_variant(None) == DEFAULT_VARIANT


def test_full_variant_roundtrip():
    variant = load_variant(json.dumps(FULL_ALTERNATE))
    assert variant.model_dump(mode='json') == FULL_ALTERNATE


def test_bad_variant_raises():
    broken = {key: value for key, value in FULL_ALTERNATE.items() if key != 'rules'}
    with pytest.raises(ValueError, match='rules'):
        load_variant(json.dumps(broken))


def test_unknown_bug_code_raises():
    with pytest.raises(ValueError, match='zzzz'):
        parse_bugs('zzzz')


def test_ui_codes_accepted():
    assert parse_bugs(','.join(sorted(UI_BUG_CODES))) == frozenset()


def test_unset_bugs_empty():
    assert parse_bugs(None) == frozenset()


def test_app_start_fails_on_bad_env(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, 'db_path', tmp_path / 'claimly.db')
    monkeypatch.setattr(settings, 'claimly_bugs', 'zzzz')
    with pytest.raises(ValueError):
        create_app_from_settings()
