namespace tagApiHrd.Services.master
{
    public class FaktaIntegritasFileService : IFaktaIntegritasFileService
    {
        private const long MaxFileSizeBytes = 2 * 1024 * 1024;
        private readonly string _directory;

        public FaktaIntegritasFileService(
            IConfiguration configuration,
            IWebHostEnvironment environment)
        {
            var configured =
                configuration["FileStorage:FaktaIntegritasPath"]
                ?? "wwwroot/upload/fakta-integritas/";

            _directory = Path.IsPathRooted(configured)
                ? configured
                : Path.Combine(environment.ContentRootPath, configured);

            Directory.CreateDirectory(_directory);
        }

        public bool Exists(string noktp)
        {
            return File.Exists(GetPhysicalPath(noktp));
        }

        public string GetFileName(string noktp)
        {
            return $"{SanitizeNoktp(noktp)}.pdf";
        }

        public async Task SaveAsync(string noktp, IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File wajib diupload");

            if (file.Length > MaxFileSizeBytes)
                throw new ArgumentException("Ukuran file maksimal 2MB");

            var extension = Path.GetExtension(file.FileName);
            if (!string.Equals(extension, ".pdf", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(file.ContentType, "application/pdf", StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException("File harus berformat PDF");
            }

            var targetPath = GetPhysicalPath(noktp);

            await using var stream = new FileStream(
                targetPath,
                FileMode.Create,
                FileAccess.Write,
                FileShare.None);

            await file.CopyToAsync(stream);
        }

        public async Task<string?> ReadBase64Async(string noktp)
        {
            var path = GetPhysicalPath(noktp);
            if (!File.Exists(path))
                return null;

            var bytes = await File.ReadAllBytesAsync(path);
            return Convert.ToBase64String(bytes);
        }

        public bool Delete(string noktp)
        {
            var path = GetPhysicalPath(noktp);
            if (!File.Exists(path))
                return false;

            File.Delete(path);
            return true;
        }

        private string GetPhysicalPath(string noktp)
        {
            return Path.Combine(_directory, GetFileName(noktp));
        }

        private static string SanitizeNoktp(string noktp)
        {
            if (string.IsNullOrWhiteSpace(noktp))
                throw new ArgumentException("No KTP wajib diisi");

            var safe = new string(
                noktp.Trim()
                    .Where(c => char.IsLetterOrDigit(c) || c == '-' || c == '_')
                    .ToArray());

            if (string.IsNullOrEmpty(safe))
                throw new ArgumentException("No KTP tidak valid");

            return safe;
        }
    }
}
