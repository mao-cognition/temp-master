"""フロントエンド index.html の jQuery 関連セキュリティ要件の静的チェック（CVE-2015-9251 対策）。"""

import re
from pathlib import Path

import pytest

INDEX_HTML = Path(__file__).resolve().parents[2] / "switchbot-frontend" / "index.html"


@pytest.fixture(scope="module")
def index_html() -> str:
    return INDEX_HTML.read_text(encoding="utf-8")


def _jquery_script_tags(html: str) -> list[str]:
    return re.findall(r"<script[^>]+/jquery/[^>]*>", html)


def _ajax_blocks(html: str) -> list[str]:
    """`$.ajax({ ... })` のオプションオブジェクト部分を括弧の対応で切り出す。"""
    blocks = []
    for m in re.finditer(r"\$\.ajax\(\s*\{", html):
        start = m.end() - 1
        depth = 0
        for i in range(start, len(html)):
            if html[i] == "{":
                depth += 1
            elif html[i] == "}":
                depth -= 1
                if depth == 0:
                    blocks.append(html[start : i + 1])
                    break
    return blocks


def test_jquery_is_3x(index_html):
    tags = _jquery_script_tags(index_html)
    assert len(tags) == 1
    m = re.search(r"/jquery/(\d+)\.(\d+)\.(\d+)/", tags[0])
    assert m is not None
    # 3.0.0 未満は CVE-2015-9251 の影響あり。4.x は Bootstrap 3 JS と非互換。
    assert int(m.group(1)) == 3


def test_jquery_has_sri(index_html):
    tag = _jquery_script_tags(index_html)[0]
    assert re.search(r'integrity="sha384-[A-Za-z0-9+/=]+"', tag)
    assert 'crossorigin="anonymous"' in tag


def test_all_ajax_calls_specify_json_datatype(index_html):
    blocks = _ajax_blocks(index_html)
    assert len(blocks) >= 4
    for block in blocks:
        assert re.search(r"dataType\s*:\s*'json'", block), block
