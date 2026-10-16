import os
import tempfile
from pathlib import Path

PORT = int(os.environ.get('PORT', '7420'))
DB_PATH = os.environ.get('DB_PATH', os.path.join(tempfile.gettempdir(), 'bookhub.db'))
SEED_PATH = Path(os.environ.get('SEED_PATH', Path(__file__).resolve().parent.parent / 'seed' / 'default.json'))
