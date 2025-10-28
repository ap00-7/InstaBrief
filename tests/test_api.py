from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def test_health():
    resp = client.get('/health')
    assert resp.status_code == 200
    assert resp.json()['status'] == 'ok'


def test_summarize_smoke(monkeypatch):
    # monkeypatch summarizer to avoid model download in CI
    from app.routes import summarize as summarize_route

    def fake_generate_summary(self, text: str, max_length=None):
        return text[:10] + '...'

    monkeypatch.setattr(summarize_route.SummarizerService, 'generate_summary', fake_generate_summary)

    resp = client.post('/api/summarize', json={'text': 'This is a long input for testing.'})
    assert resp.status_code == 200
    data = resp.json()
    assert 'summary' in data
    assert data['summary'].endswith('...')


