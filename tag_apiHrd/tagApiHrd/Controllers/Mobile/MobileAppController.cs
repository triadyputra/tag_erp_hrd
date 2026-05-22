using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using tagApiHrd.Model.Dto;
using tagApiHrd.Model.Dto.mobile;
using tagApiHrd.Model.Options;
using Microsoft.AspNetCore.Hosting;

namespace tagApiHrd.Controllers.Mobile
{
    /// <summary>Cek versi aplikasi mobile (tanpa JWT). Konfigurasi: section MobileApp di appsettings.</summary>
    [Route("api/[controller]")]
    [ApiController]
    public class MobileAppController : ControllerBase
    {
        private readonly MobileAppUpdateOptions _options;
        private readonly IWebHostEnvironment _env;

        public MobileAppController(IOptionsSnapshot<MobileAppUpdateOptions> options, IWebHostEnvironment env)
        {
            _options = options.Value;
            _env = env;
        }

        /// <summary>
        /// Bandingkan versi app dengan konfigurasi server. Kirim currentVersionCode = versionCode / native build dari perangkat.
        /// </summary>
        /// <param name="platform">android (default) atau ios</param>
        /// <param name="currentVersionCode">Build number app yang terpasang (opsional; tanpa ini UpdateAvailable = false)</param>
        [HttpGet("CheckUpdate")]
        [AllowAnonymous]
        public ActionResult<ApiResponse<AppUpdateCheckResponse>> CheckUpdate(
            [FromQuery] string platform = "android",
            [FromQuery] int? currentVersionCode = null)
        {
            var p = (platform ?? "android").Trim().ToLowerInvariant();
            var cfg = p == "ios" ? _options.Ios : _options.Android;

            var downloadUrlForClient = p == "android"
                ? ResolveAndroidDownloadUrl(cfg)
                : (string.IsNullOrWhiteSpace(cfg.DownloadUrl) ? null : cfg.DownloadUrl.Trim());

            if (p == "android" && string.IsNullOrWhiteSpace(downloadUrlForClient))
            {
                return Ok(ApiResponse<AppUpdateCheckResponse>.Success(
                    new AppUpdateCheckResponse
                    {
                        LatestVersionCode = cfg.LatestVersionCode,
                        LatestVersionName = cfg.LatestVersionName ?? "",
                        MinVersionCode = cfg.MinVersionCode,
                        DownloadUrl = "",
                        Sha256 = cfg.Sha256,
                        ReleaseNotes = cfg.ReleaseNotes,
                        StoreUrl = cfg.StoreUrl,
                        UpdateAvailable = false,
                        ForceUpdate = false,
                        Platform = "android",
                    },
                    "Konfigurasi Android: isi DownloadUrl atau ApkPhysicalPath (wwwroot/apk/...)."));
            }

            if (p == "ios" && string.IsNullOrWhiteSpace(downloadUrlForClient)
                && string.IsNullOrWhiteSpace(cfg.StoreUrl))
            {
                return Ok(ApiResponse<AppUpdateCheckResponse>.Success(
                    new AppUpdateCheckResponse
                    {
                        LatestVersionCode = cfg.LatestVersionCode,
                        LatestVersionName = cfg.LatestVersionName ?? "",
                        MinVersionCode = cfg.MinVersionCode,
                        DownloadUrl = "",
                        Sha256 = cfg.Sha256,
                        ReleaseNotes = cfg.ReleaseNotes,
                        StoreUrl = cfg.StoreUrl ?? "",
                        UpdateAvailable = false,
                        ForceUpdate = false,
                        Platform = "ios",
                    },
                    "Konfigurasi iOS: isi StoreUrl dan/atau DownloadUrl."));
            }

            var updateAvailable = currentVersionCode.HasValue
                && cfg.LatestVersionCode > currentVersionCode.Value;

            var belowMinimum = currentVersionCode.HasValue && cfg.MinVersionCode > 0
                && currentVersionCode.Value < cfg.MinVersionCode;

            var force = belowMinimum || (cfg.ForceUpdate && updateAvailable);

            var body = new AppUpdateCheckResponse
            {
                LatestVersionCode = cfg.LatestVersionCode,
                LatestVersionName = cfg.LatestVersionName ?? "",
                MinVersionCode = cfg.MinVersionCode,
                DownloadUrl = downloadUrlForClient ?? "",
                Sha256 = cfg.Sha256,
                ReleaseNotes = cfg.ReleaseNotes,
                StoreUrl = cfg.StoreUrl,
                UpdateAvailable = updateAvailable,
                ForceUpdate = force,
                Platform = p == "ios" ? "ios" : "android",
            };

            return Ok(ApiResponse<AppUpdateCheckResponse>.Success(body, "OK"));
        }

        /// <summary>
        /// Android: <see cref="PlatformAppUpdate.DownloadUrl"/> eksplisit; jika kosong + <see cref="PlatformAppUpdate.ApkPhysicalPath"/> ada,
        /// URL <c>DownloadApk</c> dari <see cref="MobileAppUpdateOptions.PublicBaseUrl"/> (production) atau dari host request.
        /// </summary>
        private string? ResolveAndroidDownloadUrl(PlatformAppUpdate cfg)
        {
            if (!string.IsNullOrWhiteSpace(cfg.DownloadUrl))
                return cfg.DownloadUrl.Trim();
            if (string.IsNullOrWhiteSpace(cfg.ApkPhysicalPath))
                return null;

            var pub = _options.PublicBaseUrl?.Trim();
            if (!string.IsNullOrWhiteSpace(pub))
            {
                var baseUrl = pub.TrimEnd('/');
                return $"{baseUrl}/api/MobileApp/DownloadApk";
            }

            return Url.ActionLink(nameof(DownloadApk), "MobileApp");
        }

        /// <summary>
        /// Mengalirkan file APK dari disk server (path di <c>MobileApp:Android:ApkPhysicalPath</c>).
        /// <c>CheckUpdate</c> mengisi <c>DownloadUrl</c> ke endpoint ini otomatis bila <c>DownloadUrl</c> di appsettings kosong.
        /// </summary>
        [HttpGet("DownloadApk")]
        [AllowAnonymous]
        public IActionResult DownloadApk()
        {
            var raw = _options.Android.ApkPhysicalPath;
            if (string.IsNullOrWhiteSpace(raw))
                return NotFound("ApkPhysicalPath belum dikonfigurasi.");

            var path = Path.IsPathRooted(raw)
                ? raw
                : Path.GetFullPath(Path.Combine(_env.ContentRootPath, raw.TrimStart('/', '\\')));

            if (!System.IO.File.Exists(path))
                return NotFound($"File APK tidak ditemukan: {path}");

            var fileName = Path.GetFileName(path);
            if (!fileName.EndsWith(".apk", StringComparison.OrdinalIgnoreCase))
                return BadRequest("File yang dikonfigurasi bukan .apk.");

            var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read,
                bufferSize: 1024 * 64, FileOptions.Asynchronous);

            Response.Headers.Append("Content-Disposition",
                $"attachment; filename=\"{Uri.EscapeDataString(fileName)}\"");

            return File(stream, "application/vnd.android.package-archive", fileDownloadName: fileName,
                enableRangeProcessing: true);
        }
    }
}
