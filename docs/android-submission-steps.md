# Android Submission Steps

Steps to build and submit the Android app to Google Play once the Play Console developer account is approved.

Package: `cloud.askadam.bibletour`
EAS submit profile: `production` (see [mobile/eas.json](../mobile/eas.json))

## 1. One-time Play Console setup

1. Sign in to [Google Play Console](https://play.google.com/console) with the approved developer account.
2. Create a new app:
   - **App name:** Tour of the Bible
   - **Default language:** English (US)
   - **App / Game:** App
   - **Free / Paid:** Free
   - Accept the declarations.
3. After creation, go to **Setup → App integrity** (or skip and revisit) — Play app signing is enabled by default.
4. Confirm the package name `cloud.askadam.bibletour` is reserved by uploading the first AAB manually (next step).

## 2. First AAB upload (manual — required by Play)

Play requires the very first AAB to be uploaded through the console UI. EAS Submit can handle every upload after that.

```bash
cd mobile
eas build --platform android --profile production
```

When the build finishes, download the `.aab` from the EAS build page and upload it under **Testing → Internal testing → Create new release**. Save as draft; no need to roll it out yet.

## 3. Create a service account for EAS Submit

1. Play Console → **Setup → API access**.
2. Click **Create new service account** — this opens Google Cloud Console.
3. In Google Cloud: create a service account (any name, e.g. `eas-submit`), skip role assignment, then **Create key → JSON**. Save the JSON file somewhere safe (do not commit it).
4. Back in Play Console → API access, click **Grant access** next to the new service account.
5. Permissions: **Admin (all permissions)** is simplest, or at minimum:
   - Releases — Release to production, exclude devices, and use Play App Signing
   - Releases — Release apps to testing tracks
   - Store presence — Edit store listing, pricing & distribution
6. Apply, Invite user.

## 4. Upload the service account key to EAS

```bash
cd mobile
eas credentials
# Platform: Android
# Profile: production
# Choose: Google Service Account Key — Submissions
# Upload the JSON file
```

EAS stores the key server-side; you don't need it on your machine after this.

## 5. Build + submit (both platforms going forward)

```bash
cd mobile
eas build --platform all --profile production
eas submit --platform ios --profile production --latest
eas submit --platform android --profile production --latest
```

The Android submission lands on the **Internal testing** track as a **draft** (per [mobile/eas.json](../mobile/eas.json)). Promote to production from the Play Console when ready.

## Profile reference

Current Android submit profile in [mobile/eas.json](../mobile/eas.json):

```json
"android": {
  "track": "internal",
  "releaseStatus": "draft",
  "changesNotSentForReview": false
}
```

- Change `track` to `"production"` to ship straight to the public track once confident.
- `releaseStatus: "draft"` means EAS uploads the build but doesn't publish — you confirm in the console.

## Store listing assets needed

Same copy as App Store listing where possible. Play-specific requirements:

- **App icon:** 512×512 PNG (32-bit, no alpha)
- **Feature graphic:** 1024×500 PNG/JPG
- **Screenshots:** at least 2, phone (16:9 or 9:16, min 320px)
- **Short description:** 80 chars
- **Full description:** 4000 chars
- **Privacy policy URL:** https://bible-tour.vercel.app/privacy
- **Support email** + content rating questionnaire + data safety form

## Status

- [ ] Play Console developer account approved
- [ ] App created in Play Console
- [ ] First AAB uploaded manually to internal testing
- [ ] Service account created and key uploaded to EAS
- [ ] Test submission via `eas submit --platform android` succeeds
