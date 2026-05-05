using Microsoft.AspNetCore.Identity;

namespace tagApi.Model
{
    public class ApplicationRole : IdentityRole
    {
        public string? Access { get; set; }
        public string? Keterangan { get; set; }
        public string? Photo { get; set; }
    }
}
