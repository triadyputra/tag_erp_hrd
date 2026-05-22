namespace tagApiHrd.Model.Options
{
    public class MobileAppUpdateOptions
    {
        /// <summary>
        /// Base URL publik situs API (tanpa slash di akhir), mis. <c>https://apisistag.tag.co.id/erp-hrd</c>.
        /// Dipakai menyusun URL <c>.../api/MobileApp/DownloadApk</c> bila <see cref="PlatformAppUpdate.DownloadUrl"/> kosong,
        /// agar tidak memakai host <c>localhost</c> dari permintaan internal.
        /// </summary>
        public string? PublicBaseUrl { get; set; }

        public PlatformAppUpdate Android { get; set; } = new();
        public PlatformAppUpdate Ios { get; set; } = new();
    }

    public class PlatformAppUpdate
    {
        /// <summary>versionCode Android / CFBundleVersion iOS (integer).</summary>
        public int LatestVersionCode { get; set; }

        public string LatestVersionName { get; set; } = "";

        /// <summary>Jika app di bawah ini, anggap wajib update (selain flag ForceUpdate).</summary>
        public int MinVersionCode { get; set; }

        /// <summary>
        /// URL unduh eksplisit (CDN, dll.). Kosongkan jika pakai <see cref="ApkPhysicalPath"/> — <c>CheckUpdate</c> akan mengisi URL ke <c>DownloadApk</c> otomatis.
        /// </summary>
        public string DownloadUrl { get; set; } = "";

        /// <summary>
        /// Hanya Android: path ke file .apk. Absolut, atau relatif ke folder project API (mis. <c>wwwroot/apk/hr-mobile.apk</c>).
        /// </summary>
        public string? ApkPhysicalPath { get; set; }

        public string? Sha256 { get; set; }

        public string? ReleaseNotes { get; set; }

        /// <summary>Jika true, client harus memaksa update tanpa opsi "nanti".</summary>
        public bool ForceUpdate { get; set; }

        /// <summary>iOS: link App Store / TestFlight (unduh bebas IPA tidak untuk umum).</summary>
        public string? StoreUrl { get; set; }
    }
}
