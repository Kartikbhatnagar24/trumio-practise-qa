from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

    db_path: Path = Path('/tmp/claimly.db')
    receipts_dir: Path = Path('/tmp/claimly-receipts')
    seed_path: Path = ROOT / 'seed' / 'default.json'
    jwt_secret: str = 'claimly-dev-secret'
    claimly_variant: str | None = None
    claimly_bugs: str | None = None


settings = Settings()
