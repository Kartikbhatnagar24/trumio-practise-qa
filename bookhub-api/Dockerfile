FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=7420 DB_PATH=/tmp/bookhub.db
WORKDIR /srv

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY seed ./seed

RUN useradd --uid 10001 --no-create-home bookhub
USER 10001

EXPOSE 7420
CMD ["python", "-m", "app"]
