#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""IGの長期アクセストークンを延命する（GitHub Actions側）。

長期トークンは60日で切れる。refresh を叩くとそこからさらに60日に延びるので、
週1で様子を見ておけば実質無期限になる。**60日放置して切らせると復活できず、
Metaアプリでのトークン再発行（本人のブラウザ操作）からやり直し**になる。

新しいトークンは GitHub Secret の IG_ACCESS_TOKEN に書き戻す。
書き戻しには GH_PAT（otokuma-jp の Secrets 読み書きのみに絞った
fine-grained PAT）を使う。

トークンの値は一切ログに出さない。
"""
import json, os, subprocess, sys, urllib.error, urllib.parse, urllib.request

TOKEN = os.environ.get("IG_ACCESS_TOKEN", "").strip()
REPO = os.environ.get("GITHUB_REPOSITORY", "ryumanoir-cyber/otokuma-jp").strip()
HAS_PAT = bool(os.environ.get("GH_TOKEN", "").strip())


def die(msg):
    print("✗ " + msg, file=sys.stderr)
    sys.exit(1)


def main():
    if not TOKEN:
        die("IG_ACCESS_TOKEN が未設定")

    # まだ有効か確認する。切れていればここで分かる
    try:
        urllib.request.urlopen(
            "https://graph.instagram.com/v23.0/me?fields=user_id&access_token="
            + urllib.parse.quote(TOKEN), timeout=30).read()
    except urllib.error.HTTPError as e:
        die("トークンが既に無効。Metaアプリで再発行が必要:\n"
            + e.read().decode(errors="replace")[:300])
    print("✓ 現在のトークンは有効")

    url = ("https://graph.instagram.com/refresh_access_token?"
           + urllib.parse.urlencode({"grant_type": "ig_refresh_token",
                                     "access_token": TOKEN}))
    try:
        data = json.loads(urllib.request.urlopen(url, timeout=60).read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        if "24 hours" in body or "too early" in body.lower():
            print("◦ 発行から24時間経っていないので今回は延命しない（次回に回す）")
            return
        die("延命に失敗:\n" + body[:300])

    days = int(data.get("expires_in", 0)) // 86400
    print(f"✓ 延命した（あと約{days}日）")

    if not HAS_PAT:
        die("GH_PAT が未設定のため Secret に書き戻せない")

    p = subprocess.run(["gh", "secret", "set", "IG_ACCESS_TOKEN", "--repo", REPO],
                       input=data["access_token"], text=True, capture_output=True)
    if p.returncode != 0:
        die("Secretの書き戻しに失敗: " + p.stderr)
    print("✓ IG_ACCESS_TOKEN を更新した")


if __name__ == "__main__":
    main()
