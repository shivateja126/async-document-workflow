FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY pyproject.toml ./
RUN pip install --upgrade pip setuptools wheel && pip install .

COPY . .
RUN pip install .

EXPOSE 8000

CMD ["./scripts/start-api.sh"]
