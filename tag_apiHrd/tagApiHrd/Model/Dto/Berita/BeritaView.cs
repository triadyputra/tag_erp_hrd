namespace tagApiHrd.Model.Dto.Berita
{
    public class BeritaView
    {
        public int Id { get; set; }

        public string Judul { get; set; } = string.Empty;

        public string? Slug { get; set; }

        public string Isi { get; set; } = string.Empty;
        public int Status { get; set; }

        public string? Gambar { get; set; }

        public bool IsPinned { get; set; }

        public DateTime? CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}
