#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""IGの長期アクセストークンを延命する。

長期トークンは60日で切れる。ig_refresh_token を叩くと、そこからさらに60日に延びる。
条件は「発行から24時間以上経っている」「まだ失効していない」こと。
**60日放置して切らせると復活できず、最初のトークン取得からやり直しになる。**
だから月1回まわしておく。

新しいトークンは GitHub Secret の IG_ACCESS_TOKEN に書き戻す。
書き戻しには secrets:write 権限のある PAT（GH_PAT）が要る。
GH_PAT が無い場合は、新トークンを出力せず「手で更新して」とだけ言って落とす
（トークンをログに残さないため）。
"""
import json, os, sys, subprocess, urllib.request, urllib.error, urllib.parse

TOKEN = os.environ.get("IG_ACCESS_TOKEN", "").strip()
REPO = os.environ.get("GITHUB_REPOSITORY", "").strip()
HAS_PAT = bool(os.environ.get("GH_TOKEN", "").strip())


def die(msg):
    print("✗ " + msg, file=sys.stderr)
    sys.exit(1)


def main():
    if not TOKEN:
        die("IG_ACCESS_TOKEN が未設定")

    url = ("https://graph.instagram.com/refresh_access_token?"
           + urllib.parse.urlencode({"grant_type": "ig_refresh_token",
                                     "access_token": TOKEN}))
    try:
        with urllib.request.urlopen(url, timeout=60) as r:
            data = json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        die("更新に失敗（切れている可能性）。取り直しが必要:\n" + e.read().decode(errors="replace"))

    new = data["access_token"]
    days = int(data.get("expires_in", 0)) // 86400
    print(f"✓ トークンを更新（あと約{days}日）")

    if not HAS_PAT:
        die("GH_PAT が未設定なので Secret に書き戻せない。手動で更新してください")

    # 値は標準入力で渡す。引数に書くとプロセス一覧から見えるため
    p = subprocess.run(["gh", "secret", "set", "IG_ACCESS_TOKEN",
                        "--repo", REPO, "--body-file", "-"],
                       input=new, text=True, capture_output=True)
    if p.returncode != 0:
        die("Secretの書き戻しに失敗: " + p.stderr)
    print("✓ IG_ACCESS_TOKEN を書き戻した")


if __name__ == "__main__":
    main()
