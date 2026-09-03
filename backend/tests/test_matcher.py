import pytest
from app.services.matcher import cosine_similarity

def test_cosine_similarity_identical():
    v1 = [1.0] * 512
    v2 = [1.0] * 512
    score = cosine_similarity(v1, v2)
    assert abs(score - 1.0) < 1e-5

def test_cosine_similarity_orthogonal():
    v1 = [1.0 if i < 256 else 0.0 for i in range(512)]
    v2 = [0.0 if i < 256 else 1.0 for i in range(512)]
    score = cosine_similarity(v1, v2)
    assert abs(score - 0.0) < 1e-5
