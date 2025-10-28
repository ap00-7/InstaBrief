# InstaBrief

Full-stack summarization web app with FastAPI, React + Tailwind, MongoDB, Elasticsearch, and Transformers.

## Quickstart

Prereqs: Docker Desktop

1. Build and start

```
docker compose up -d --build
```

2. Open services
- API: http://localhost:8000/health
- Frontend: http://localhost:5173

## Local Dev (without Docker)

- Python 3.11
```
python -m venv .venv
. .venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
- Frontend
```
cd frontend
npm install
npm run dev
```

## Notes
- First summarization loads `facebook/bart-large-cnn`.
- spaCy model `en_core_web_sm` downloads on first NLP call.
- MongoDB at `mongodb://localhost:27017`, Elasticsearch at `http://localhost:9200` by default.

## Tests
```
pytest -q
```
