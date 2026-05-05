using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace tagApi.Model
{
    public class ApplicationUser : IdentityUser
    {
        [Required]
        [StringLength(256, ErrorMessage = "Panjang karakter {0} tidak boleh lebih dari {2}")]
        public string FullName { get; set; } = string.Empty;
        public string? Photo { set; get; }
        public bool Active { get; set; }
        public string? Cabang { set; get; }
        public int SessionVersion { get; set; } = 0;
    }
}
