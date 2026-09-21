#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""投稿の在庫が尽きかけていたら、ワークフローを失敗させて通知を飛ばす。

在庫切れは「エラー」ではないので放っておくと静かに止まる。それが唯一
気づけない穴なので、残りが少なくなった時点でわざと失敗させて
GitHubからメールを飛ばす。

投稿そのものとは別ステップにしてある。ここが赤くなっても
「投稿は成功している。補充が要るだけ」と読めるようにするため。
"""
import datetime, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JST = datetime.timezone(datetime.timedelta(hours=9))
WARN_AT = 4          # 残りがこの日数以下になったら知らせる


def main():
    today = datetime.datetime.now(JST).date()
    ig = ROOT / "ig"
    if not ig.exists():
        print("✗ ig/ が無い")
        sys.exit(1)

    upcoming = []
    for d in sorted(p.name for p in ig.iterdir() if p.is_dir()):
        try:
            content_date = datetime.date.fromisoformat(d)
        except ValueError:
            continue
        post_night = content_date - datetime.timedelta(days=1)
        if post_night >= today and (ig / d / "post.json").exists():
            upcoming.append((post_night, content_date))

    if not upcoming:
        print("✗ 在庫がありません。今夜以降、投稿は出ません。")
        print("  補充: ig-daily/batch.py → ig-publish/prepare.py --commit")
        sys.exit(1)

    print(f"残りの在庫: {len(upcoming)}夜分")
    for night, content in upcoming:
        print(f"  {night} の夜 → {content} 分")

    last = upcoming[-1][0]
    if len(upcoming) <= WARN_AT:
        print()
        print("━" * 48)
        print(f"  投稿は成功しています。これは補充のお知らせです。")
        print(f"  在庫は残り{len(upcoming)}夜分。最後の投稿は {last} の夜です。")
        print()
        print("  補充するコマンド:")
        print("    cd Project/threads-kurono-uranai/tools/ig-daily && python3.12 batch.py")
        print("    cd ../ig-publish && python3.12 prepare.py --commit")
        print("━" * 48)
        sys.exit(1)

    print(f"\n✓ 十分あります（最後の投稿は {last} の夜）")


if __name__ == "__main__":
    main()
