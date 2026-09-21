#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""黒の占い師 IG毎日投稿 ─ カルーセルを1件公開する。

GitHub Actions から毎日 12:00 UTC（＝21:00 JST）に実行され、
**翌日分**のフォルダを1件のカルーセル投稿として公開する。
（毎晩21時に翌日の運勢を出す、が実測の勝ちパターン）

使う API は "Instagram API with Instagram Login"（graph.instagram.com）。
Facebookページは不要。自分のアカウントに出すだけなので App Review も不要。

必要な環境変数（GitHub Secrets）:
  IG_USER_ID       Instagramプロアカウントのユーザーid
  IG_ACCESS_TOKEN  長期アクセストークン（60日。ig-token-refresh.yml が延命する）

投稿するものが無い日は、何もせず正常終了する（エラーにしない）。
"""
import json, os, sys, time, datetime, urllib.request, urllib.parse, urllib.error
from pathlib import Path

API = "https://graph.instagram.com/v23.0"
SITE = "https://otokuma-jp.com"
ROOT = Path(__file__).resolve().parent.parent      # リポジトリのルート
JST = datetime.timezone(datetime.timedelta(hours=9))

IG_USER_ID = os.environ.get("IG_USER_ID", "").strip()
TOKEN = os.environ.get("IG_ACCESS_TOKEN", "").strip()


def die(msg, code=1):
    print("✗ " + msg, file=sys.stderr)
    sys.exit(code)


def api(method, path, **params):
    """Graph APIを叩く。失敗時はMetaのエラー本文をそのまま出して落とす。"""
    params["access_token"] = TOKEN
    url = f"{API}/{path}"
    data = urllib.parse.urlencode(params).encode()
    req = urllib.request.Request(url, data=data if method == "POST" else None,
                                 method=method)
    if method == "GET":
        req = urllib.request.Request(url + "?" + urllib.parse.urlencode(params), method="GET")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        die(f"{method} {path} が {e.code} で失敗\n{body}")


def reachable(url):
    """MetaがcURLする前に、こちらで到達確認する。
    GitHub Pagesのビルドは非同期なので、push直後は404になりうる。"""
    req = urllib.request.Request(url, method="HEAD")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status == 200
    except Exception:
        return False


def wait_until_live(urls, tries=10, wait=30):
    for n in range(1, tries + 1):
        missing = [u for u in urls if not reachable(u)]
        if not missing:
            print(f"✓ 画像{len(urls)}枚の公開を確認")
            return
        print(f"… 未反映 {len(missing)}枚（{n}/{tries}）{wait}秒待つ")
        time.sleep(wait)
    die("画像が公開URLに出てこない:\n  " + "\n  ".join(missing))


def main():
    if not IG_USER_ID or not TOKEN:
        die("IG_USER_ID / IG_ACCESS_TOKEN が未設定")

    target = (datetime.datetime.now(JST) + datetime.timedelta(days=1)).date().isoformat()
    day = ROOT / "ig" / target
    manifest = day / "post.json"

    if not manifest.exists():
        # 在庫切れ。落とさずに知らせるだけにする（毎朝の失敗通知で気づける）
        print(f"◦ {target} の投稿データが無いので何もしない（在庫切れ）")
        return

    post = json.loads(manifest.read_text(encoding="utf-8"))
    caption = post["caption"]
    images = post["images"]
    if not 2 <= len(images) <= 10:
        die(f"カルーセルは2〜10枚。今回は{len(images)}枚")

    urls = [f"{SITE}/ig/{target}/{name}" for name in images]
    print(f"▶ {target} 分を投稿する（{len(urls)}枚）")
    wait_until_live(urls)

    limit = api("GET", f"{IG_USER_ID}/content_publishing_limit",
                fields="config,quota_usage")
    print("  投稿枠:", json.dumps(limit.get("data", [{}])[0], ensure_ascii=False))

    # 1. 各画像のコンテナ
    children = []
    for i, u in enumerate(urls, 1):
        r = api("POST", f"{IG_USER_ID}/media", image_url=u, is_carousel_item="true")
        children.append(r["id"])
        print(f"  [{i}/{len(urls)}] container {r['id']}")

    # 2. カルーセル本体
    parent = api("POST", f"{IG_USER_ID}/media", media_type="CAROUSEL",
                 children=",".join(children), caption=caption)
    print("  carousel", parent["id"])

    # 3. 公開
    pub = api("POST", f"{IG_USER_ID}/media_publish", creation_id=parent["id"])
    print(f"✓ 公開した media_id={pub['id']}  ({target}分)")


if __name__ == "__main__":
    main()
