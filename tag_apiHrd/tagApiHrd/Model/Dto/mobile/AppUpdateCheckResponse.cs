namespace tagApiHrd.Model.Dto.mobile
{
    /// <summary>Payload Data untuk GET MobileApp/CheckUpdate.</summary>
    public class AppUpdateCheckResponse
    {
        public int LatestVersionCode { get; set; }
        public string LatestVersionName { get; set; } = "";
        public int MinVersionCode { get; set; }
        public string DownloadUrl { get; set; } = "";
        public string? Sha256 { get; set; }
        public string? ReleaseNotes { get; set; }
        public string? StoreUrl { get; set; }

        /// <summary>True jika currentVersionCode (query) lebih kecil dari LatestVersionCode.</summary>
        public bool UpdateAvailable { get; set; }

        /// <summary>True jika ForceUpdate di config, atau current &lt; MinVersionCode.</summary>
        public bool ForceUpdate { get; set; }

        /// <summary>Platform yang dipakai untuk respons (android / ios).</summary>
        public string Platform { get; set; } = "";
    }
}
