# Tutorial Upload HR-TAG ke Google Play Store

Panduan lengkap dari rilis pertama sampai upload update versi berikutnya.

---

## Informasi Aplikasi

| Item | Nilai |
|------|-------|
| Nama app | HR-TAG |
| Package name | `id.co.tag.hrmobile` |
| Versi saat ini | `1.0.0` (versionCode `1`) |
| Format upload | **AAB** (Android App Bundle) — wajib Play Store |
| Build lokal | Expo prebuild + Gradle |

> **Penting:** Package name `id.co.tag.hrmobile` **tidak bisa diubah** setelah rilis pertama.

---

## Prasyarat

Sebelum mulai, pastikan sudah terpasang:

1. **Akun Google Play Console** — daftar di https://play.google.com/console (biaya sekali $25)
2. **JDK 17**
3. **Android Studio** + Android SDK 35
4. **Node.js** + npm
5. Environment variable `ANDROID_HOME` (opsional — script otomatis deteksi SDK di `%LOCALAPPDATA%\Android\Sdk`)

---

## Bagian A — Rilis Pertama (Upload Pertama Kali)

### Langkah 1: Build AAB

Jalankan di folder root proyek (`tag_hr_mobile`):

```powershell
npm run android:release
```

Script ini otomatis:
- Membuat upload keystore (jika belum ada): `hr-tag-upload.keystore`
- Menulis `android/keystore.properties` dan `android/local.properties`
- Menjalankan `expo prebuild --platform android --clean`
- Membangun AAB signed: `android/app/build/outputs/bundle/release/app-release.aab`

**Build ulang tanpa prebuild** (lebih cepat, jika `android/` sudah ada):

```powershell
npm run android:release -- -SkipPrebuild
```

### Langkah 2: Simpan Keystore (WAJIB)

File dan password ini **harus disimpan aman** — tanpa ini Anda tidak bisa upload update:

| File | Lokasi |
|------|--------|
| Upload keystore | `hr-tag-upload.keystore` (root proyek) |
| Alias | `hr-tag` |
| Password default | `HrTagPlayStore2026!` |

Simpan backup keystore di tempat aman (cloud terenkripsi, USB, dll.). **Jangan commit ke git.**

### Langkah 3: Buat Aplikasi di Play Console

1. Buka https://play.google.com/console
2. Klik **Create app**
3. Isi:
   - **App name:** HR-TAG
   - **Default language:** Indonesian (Indonesia)
   - **App or game:** App
   - **Free or paid:** Free
4. Centang deklarasi kebijakan → **Create app**

### Langkah 4: Lengkapi Setup Wajib

Sebelum bisa publish, isi semua bagian berikut di Play Console:

#### 4a. Store listing (Grow → Store presence → Main store listing)

| Field | Isi |
|-------|-----|
| App name | HR-TAG |
| Short description | Maks. 80 karakter — deskripsi singkat app HR |
| Full description | Maks. 4000 karakter — fitur lengkap |
| App icon | 512×512 px — pakai `assets/images/tag_icon_app.png` |
| Feature graphic | 1024×500 px |
| Phone screenshots | Minimal 2 buah |

#### 4b. Privacy policy (wajib)

- **Policy → App content → Privacy policy**
- Masukkan URL kebijakan privasi perusahaan (wajib untuk app HR)

#### 4c. App access

- **Policy → App content → App access**
- Pilih **All or some functionality is restricted** (karena butuh login)
- Berikan **akun demo** + instruksi untuk reviewer Google:
  - Username: akun demo karyawan
  - Password: password demo
  - Instruksi: "Login, lalu buka menu utama HR"

#### 4d. Content rating

- **Policy → App content → Content rating**
- Isi kuesioner IARC → submit → dapatkan rating

#### 4e. Target audience

- **Policy → App content → Target audience**
- Pilih kelompok usia yang sesuai (umumnya 18+)

#### 4f. Data safety

- **Policy → App content → Data safety**
- Deklarasikan data yang dikumpulkan:
  - Kredensial login
  - Data karyawan (HR)
  - Foto profil (opsional)

#### 4g. Ads

- Tandai apakah app menampilkan iklan (HR-TAG: tidak ada iklan)

### Langkah 5: Upload AAB Pertama

Disarankan mulai dari **Internal testing** dulu:

1. **Release → Testing → Internal testing**
2. Klik **Create new release**
3. **Upload** file:
   ```
   android/app/build/outputs/bundle/release/app-release.aab
   ```
4. Isi **Release name** (mis. `1.0.0`)
5. Isi **Release notes** (bahasa Indonesia):
   ```
   Rilis pertama HR-TAG di Google Play Store.
   ```
6. Klik **Next** → **Save** → **Review release**
7. Klik **Start rollout to Internal testing**

### Langkah 6: Play App Signing

Saat upload AAB pertama, Google akan menawarkan **Play App Signing**:

- **Aktifkan** (disarankan)
- Google pegang app signing key
- Anda pegang upload key (`hr-tag-upload.keystore`)
- Jika upload key hilang, bisa reset lewat Play Console

### Langkah 7: Promosi ke Production

Setelah internal testing berjalan baik:

1. **Release → Production**
2. **Create new release** → pilih AAB yang sama atau build baru
3. **Review release** → **Start rollout to Production**
4. Tunggu review Google (app baru: biasanya 1–7 hari)

---

## Bagian B — Upload Update (Versi Berikutnya)

Setiap kali ada versi baru, ikuti langkah ini.

### Langkah 1: Naikkan Versi di `app.json`

Edit `app.json`:

```json
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2
    }
  }
}
```

Aturan:
- **`version`** — tampilan ke user (mis. `1.0.1`, `1.1.0`)
- **`versionCode`** — **harus naik** setiap upload (1 → 2 → 3 → …)
- Play Store **menolak** upload jika `versionCode` tidak lebih besar dari versi sebelumnya

Contoh penomoran:

| Rilis | version | versionCode |
|-------|---------|-------------|
| Pertama | 1.0.0 | 1 |
| Patch | 1.0.1 | 2 |
| Minor | 1.1.0 | 3 |
| Major | 2.0.0 | 4 |

### Langkah 2: Build AAB Baru

```powershell
npm run android:release
```

Atau cepat (tanpa prebuild ulang):

```powershell
npm run android:release -- -SkipPrebuild
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

> Gunakan **keystore yang sama** (`hr-tag-upload.keystore`). Jangan buat keystore baru — Play Store akan menolak.

### Langkah 3: Upload ke Play Console

1. Buka https://play.google.com/console → pilih app **HR-TAG**
2. Pilih track release:
   - **Internal testing** — uji internal dulu (disarankan)
   - **Production** — langsung ke user
3. **Create new release**
4. **Upload** AAB baru
5. Isi **Release notes**, contoh:
   ```
   Versi 1.0.1
   - Perbaikan bug login
   - Peningkatan performa
   ```
6. **Review release** → **Start rollout**

### Langkah 4: Update Backend (Check Update API)

Agar fitur cek update di app berfungsi, sesuaikan respons API:

```
GET /MobileApp/CheckUpdate?platform=android&distribution=playstore&currentVersionCode=1
```

Respons untuk user Play Store:

```json
{
  "LatestVersionCode": 2,
  "LatestVersionName": "1.0.1",
  "StoreUrl": "https://play.google.com/store/apps/details?id=id.co.tag.hrmobile",
  "DownloadUrl": "",
  "UpdateAvailable": true,
  "ForceUpdate": false,
  "ReleaseNotes": "Perbaikan bug dan peningkatan performa"
}
```

| Field | Keterangan |
|-------|------------|
| `StoreUrl` | URL Play Store — **wajib** untuk build Play Store |
| `DownloadUrl` | **Kosongkan** — app Play Store tidak sideload APK |
| `LatestVersionCode` | Harus sama dengan `versionCode` di `app.json` |
| `ForceUpdate` | `true` jika user wajib update |

App akan menampilkan tombol **Buka Play Store** (bukan unduh APK).

### Langkah 5: Verifikasi Update

1. Install versi lama dari Play Store (atau internal testing)
2. Upload versi baru ke Internal testing
3. Tambahkan email tester di **Internal testing → Testers**
4. Buka app → cek popup update → klik **Buka Play Store**
5. Update dari Play Store → pastikan versi baru terpasang

---

## Ringkasan Perintah

```powershell
# Rilis pertama / update — build lengkap
npm run android:release

# Update cepat — tanpa prebuild ulang
npm run android:release -- -SkipPrebuild

# Hanya build AAB (android/ sudah siap)
cd android
.\gradlew.bat bundleRelease
```

---

## Troubleshooting

### Build gagal: SDK location not found

Pastikan Android SDK terpasang. Script otomatis menulis `android/local.properties`. Jika gagal, buat manual:

```properties
sdk.dir=C:/Users/NAMA_USER/AppData/Local/Android/Sdk
```

### Build gagal: signing Store null

- Pastikan `android/keystore.properties` ada dan **tanpa BOM**
- Jalankan ulang: `npm run android:release -- -SkipPrebuild`
- Cek signing: `cd android` lalu `.\gradlew.bat :app:signingReport`
  - Variant `release` harus menampilkan Store ke `hr-tag-upload.keystore`

### Play Console menolak AAB: versionCode sudah dipakai

Naikkan `versionCode` di `app.json` lalu build ulang.

### Play Console menolak: signed dengan key yang salah

Gunakan keystore upload yang **sama** dengan rilis pertama (`hr-tag-upload.keystore`).

### App ditolak review: REQUEST_INSTALL_PACKAGES

Build Play Store HR-TAG sudah **tidak** memakai permission sideload APK. Pastikan upload AAB dari script `android:release`, bukan APK distribusi internal lama.

### Keystore hilang

- Jika **Play App Signing aktif**: reset upload key lewat Play Console → Setup → App signing
- Jika tidak aktif: **tidak bisa update app** — harus buat app baru dengan package berbeda

---

## Checklist Cepat

### Rilis pertama
- [ ] `npm run android:release` berhasil
- [ ] Backup `hr-tag-upload.keystore` + password
- [ ] Buat app di Play Console (`id.co.tag.hrmobile`)
- [ ] Store listing + privacy policy + data safety + akun demo
- [ ] Upload AAB ke Internal testing
- [ ] Aktifkan Play App Signing
- [ ] Promosi ke Production setelah uji

### Setiap update
- [ ] Naikkan `version` dan `versionCode` di `app.json`
- [ ] `npm run android:release` (atau `-SkipPrebuild`)
- [ ] Upload AAB baru di Play Console
- [ ] Isi release notes
- [ ] Update API `CheckUpdate` (`LatestVersionCode`, `StoreUrl`)
- [ ] Start rollout + verifikasi di device

---

## File Terkait

| File | Fungsi |
|------|--------|
| `app.json` | Versi, package name, konfigurasi Play Store |
| `scripts/build-play-store-aab.ps1` | Script build otomatis |
| `hr-tag-upload.keystore` | Upload key (jangan commit) |
| `android/keystore.properties` | Konfigurasi signing (jangan commit) |
| `release/play-console-checklist.json` | Template data Play Console |
