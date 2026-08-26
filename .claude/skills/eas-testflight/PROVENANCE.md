# Provenance — `eas-testflight`

Third-party skill, vendored verbatim. Not written by this project.

| | |
|---|---|
| Source | https://github.com/Leoyishou/personal-ai-company |
| Path in source | `claude-global/skills/api-deploy-testflight/skill.md` |
| Commit | `581367e77dc789f4d6bedced789c0e53e0f8cf80` |
| Licence | MIT (stated in the source README; the repo carries no `LICENSE` file) |
| Author | Leoyishou |

`SKILL.md` is byte-identical to the upstream `skill.md`. The only change is the
filename: upstream ships lowercase `skill.md`, and Claude Code discovers
`SKILL.md`. The directory is named for the skill's declared frontmatter `name`
(`eas-testflight`), which differs from its upstream directory name
(`api-deploy-testflight`).

## Read this before letting it touch `eas.json`

The skill's Phase 2 supplies a template `eas.json` that sets:

```json
"cli": { "appVersionSource": "remote" }
```

**This project uses `"local"`** (see `mobile/eas.json`). Version and build
number come from `mobile/app.json`, and `runtimeVersion.policy` is `appVersion`
— so an OTA update only reaches installs whose `expo.version` matches. Flipping
`appVersionSource` to `remote` desyncs that and can silently strip an EAS
Update of its audience.

The template is also thinner than ours in ways that would regress the config if
applied literally: no channels, no `APP_VARIANT` env, no Android submit block,
no `buildConfiguration`.

Treat the skill as a reference for the `eas-cli` build and submit commands.
`mobile/eas.json` is hand-maintained — do not let the skill rewrite it.

The skill does not cover EAS Update, channels, or `runtimeVersion` at all.
