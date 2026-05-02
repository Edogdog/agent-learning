def test_list_chapters(client):
    resp = client.get("/api/chapters")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 2
    assert data[0]["id"] == 1
    assert data[0]["title"] == "初识智能体"
    assert "emoji" in data[0]


def test_list_chapters_with_user(client, sample_user):
    resp = client.get(f"/api/chapters?user_id={sample_user['id']}")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 2
    assert data[0]["status"] in ("unlocked", "locked", "in_progress", "completed")


def test_get_chapter_detail(client, sample_user):
    resp = client.get(f"/api/chapters/1?user_id={sample_user['id']}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == 1
    assert len(data["stages"]) >= 3


def test_chapter_not_found(client):
    resp = client.get("/api/chapters/99")
    assert resp.status_code == 404
