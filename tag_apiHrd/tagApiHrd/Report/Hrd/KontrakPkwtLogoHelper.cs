namespace tagApi.Report.Hrd;

public static class KontrakPkwtLogoHelper
{
    /// <summary>
    /// NMPERUSAHAAN → nama file logo di wwwroot (tanpa .png).
    /// </summary>
    public static string? ResolveLogoFileName(string? nmPerusahaan)
    {
        var name = nmPerusahaan?.Trim() ?? "";

        if (name.Equals("Tunas Artha Gardatama Sekuriti", StringComparison.OrdinalIgnoreCase))
            return "tags";

        if (name.Equals("ERDEWE Artha Gardatama", StringComparison.OrdinalIgnoreCase))
            return "erdewe";

        if (name.Equals("Tunas Artha Gardatama", StringComparison.OrdinalIgnoreCase))
            return "tag";

        return null;
    }

    public static async Task<string?> LoadLogoBase64Async(string wwwrootPath, string? nmPerusahaan)
    {
        var logoFileName = ResolveLogoFileName(nmPerusahaan);
        if (string.IsNullOrEmpty(logoFileName))
            return null;

        var logoPath = Path.Combine(wwwrootPath, $"{logoFileName}.png");
        if (!File.Exists(logoPath))
            return null;

        var logoBytes = await File.ReadAllBytesAsync(logoPath);
        return Convert.ToBase64String(logoBytes);
    }

    public static bool IsErdewe(string? nmPerusahaan) =>
        nmPerusahaan?.Trim().Equals("ERDEWE Artha Gardatama", StringComparison.OrdinalIgnoreCase) == true;
}
