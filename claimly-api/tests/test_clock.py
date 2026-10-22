from datetime import UTC, date, datetime

from app.core.clock import local_today, now_iso


def test_today_follows_india_not_utc():
    assert local_today(datetime(2026, 6, 15, 20, 0, tzinfo=UTC)) == date(2026, 6, 16)


def test_today_before_midnight_ist():
    assert local_today(datetime(2026, 6, 15, 18, 0, tzinfo=UTC)) == date(2026, 6, 15)


def test_timestamps_use_the_india_offset():
    assert now_iso().endswith('+05:30')
