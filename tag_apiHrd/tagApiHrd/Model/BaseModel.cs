using System.ComponentModel.DataAnnotations;

namespace tagApi.Model
{
    public class BaseModel
    {
        [Required]
        public string created { get; set; } = string.Empty;
        public DateTime createdat { get; set; }
        public string? updated { get; set; }
        public DateTime? updatedat { get; set; }
    }
}
