def test_register(client):
    resp = client.post("/api/auth/register", json={
        "username": "alice", "nickname": "Alice",
        "python_level": "beginner", "llm_knowledge": "", "agent_awareness": "",
        "math_basis": "", "learning_goal": "project", "available_time": "5-10",
        "preferred_style": "",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == 1
    assert data["username"] == "alice"
    assert data["level"] == 1
    assert "recommended_path" in data


def test_register_duplicate(client, sample_user):
    resp = client.post("/api/auth/register", json={
        "username": "test_user", "nickname": "Dup",
        "python_level": "", "llm_knowledge": "", "agent_awareness": "",
        "math_basis": "", "learning_goal": "", "available_time": "",
        "preferred_style": "",
    })
    assert resp.status_code == 400
    assert "已存在" in resp.json()["detail"]


def test_health(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
