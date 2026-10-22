FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:0.10.0 /uv /bin/uv

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 UV_COMPILE_BYTECODE=1 PATH=/srv/.venv/bin:$PATH
WORKDIR /srv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY app ./app
COPY seed ./seed

RUN useradd --uid 10001 --no-create-home claimly
USER 10001

EXPOSE 7460
CMD ["python", "-m", "app"]
