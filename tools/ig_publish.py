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


def wait_until_finished(container_id, tries=20, wait=15):
    """コンテナがFINISHEDになるまで待つ。

    作った直後に media_publish を叩くと
    「The media is not ready for publishing」(code 9007) で400になる。
    Metaが裏で画像を取りに行って処理し終えるのを待つ必要がある。
    """
    for n in range(1, tries + 1):
        r = api("GET", container_id, fields="status_code,status")
        code = r.get("status_code")
        if code == "FINISHED":
            print(f"  ✓ コンテナ {container_id} 準備完了")
            return
        if code == "ERROR":
            die(f"コンテナ {container_id} がERROR: {r.get('status')}")
        print(f"  … コンテナ {container_id} は {code}（{n}/{tries}）{wait}秒待つ")
        time.sleep(wait)
    die(f"コンテナ {container_id} がFINISHEDにならない（{tries * wait}秒待った）")


def stamp_path(date_str):
    return ROOT / "ig" / date_str / ".published"


def is_published(date_str):
    """その日の分を既に投稿したか。

    Instagramに問い合わせて確かめるのが素直だが、`GET /{user}/media` は
    このアプリの権限では `API access blocked` で弾かれる（投稿はできるが
    読み取りはできない）。なので投稿できた時点でリポジトリに印を残し、
    それを見る。どの日が実際に出たかを後から目で追えるのも利点。
    """
    return stamp_path(date_str).exists()


def mark_published(date_str, media_id):
    p = stamp_path(date_str)
    p.write_text(
        json.dumps({"media_id": media_id,
                    "at": datetime.datetime.now(JST).isoformat()},
                   ensure_ascii=False) + "\n",
        encoding="utf-8")
    print(f"  印を残した: {p.relative_to(ROOT)}")


def publish(target):
    """target（YYYY-MM-DD）の分を1件投稿する。"""
    manifest = ROOT / "ig" / target / "post.json"
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

    # 3. 処理が終わるまで待つ（ここを飛ばすと400で落ちる）
    wait_until_finished(parent["id"])

    # 4. 公開
    pub = api("POST", f"{IG_USER_ID}/media_publish", creation_id=parent["id"])
    print(f"✓ 公開した media_id={pub['id']}  ({target}分)")
    mark_published(target, pub["id"])


def main():
    if not IG_USER_ID or not TOKEN:
        die("IG_USER_ID / IG_ACCESS_TOKEN が未設定")

    today = datetime.datetime.now(JST).date()
    tomorrow = today + datetime.timedelta(days=1)

    # 本命は「翌日分」。ただし前夜の実行が落ちていると今日分が出ていないので、
    # 今日分も対象に入れて取りこぼしを拾う（昨日以前は日が過ぎているので追わない）。
    todo = []
    for d in (today, tomorrow):
        s = d.isoformat()
        if not (ROOT / "ig" / s / "post.json").exists():
            continue
        if is_published(s):
            print(f"・{s} 分は投稿済み。飛ばす")
            continue
        todo.append(s)

    if not todo:
        if not (ROOT / "ig" / tomorrow.isoformat() / "post.json").exists():
            # 在庫切れ。ここでは落とさない。1日に何度も走るので、
            # 落とすとメールが何通も飛ぶ。通知は ig_stock_check.py の役目
            # （あちらは本命の実行でだけ動くので、1日1通で済む）
            print(f"※ {tomorrow} の投稿データがありません（在庫切れ）")
            return
        print("✓ 出すべきものは全て投稿済み。何もしない")
        return

    for i, s in enumerate(todo):
        if i:
            time.sleep(30)     # 連続投稿になるので少し空ける
        publish(s)


if __name__ == "__main__":
    main()
