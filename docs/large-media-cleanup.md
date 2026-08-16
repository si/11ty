# Large media cleanup (Aug 2026)

Five files under `img/assets/` were removed in commit `ab98212` because
Cloudflare Pages rejects any deployed file over 25MiB, and these were
silently failing every deploy:

| File | Size | Status |
|---|---|---|
| `img/assets/2018/01/Si-Cast-4-Wellbeing-with-Work.mp3` | 30M | Superseded — post now links the [YouTube video](https://m.youtube.com/watch?v=WUJrduWiUqw) instead |
| `img/assets/2018/01/Si-Cast-6-The-State-of-Social-Media-with-Simon-Hamp.mp3` | 49M | Superseded — post now links the [YouTube video](https://m.youtube.com/watch?v=xAY12wnQI-8) instead |
| `img/assets/2024/09/How-healthy-is-your-team-London-Sep-2025.pptx` | 36M | Not archived elsewhere yet — see below |
| `img/assets/2025/08/IMG_1661.mov` | 32M | Not archived elsewhere yet — see below |
| `img/assets/2025/08/IMG_1663.mov` | 45M | Not archived elsewhere yet — see below |

None of the five were referenced from any post, page, or template.

## Recovering the pptx / .mov files

These three still aren't backed up anywhere outside git. I couldn't push
them to Google Drive in the session that removed them — the Drive
connector only accepts file content inlined in the tool call, and even
the smallest of the three (32M) is far past what a single call can carry.
I also couldn't hand them back via direct file transfer — that path caps
out at 30MiB, and all three are over it.

They're still fully intact in git history, one commit before the removal
(`b027334`, pushed to `origin/claude/rss-feed-updates-dqv41e` before the
cleanup landed on top of it). To get them back:

```sh
git show b027334:"img/assets/2024/09/How-healthy-is-your-team-London-Sep-2025.pptx" > How-healthy-is-your-team-London-Sep-2025.pptx
git show b027334:"img/assets/2025/08/IMG_1661.mov" > IMG_1661.mov
git show b027334:"img/assets/2025/08/IMG_1663.mov" > IMG_1663.mov
```

Or browse/download them directly from GitHub at
`https://github.com/si/11ty/tree/b027334/img/assets/2024/09` and
`https://github.com/si/11ty/tree/b027334/img/assets/2025/08`.

These blobs will stay reachable as long as `b027334` (or a commit that
descends from it) stays reachable from some branch or tag — don't force-push
over `claude/rss-feed-updates-dqv41e`'s history without pulling them out
first, and expect this note may need updating once they're safely in Drive.
