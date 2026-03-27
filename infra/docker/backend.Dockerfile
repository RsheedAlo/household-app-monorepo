FROM python:3.13-slim

WORKDIR /app

COPY backend/pyproject.toml ./pyproject.toml
COPY backend/README.md ./README.md
COPY backend/app ./app
COPY backend/tests ./tests

RUN pip install --no-cache-dir -e .[dev]

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

