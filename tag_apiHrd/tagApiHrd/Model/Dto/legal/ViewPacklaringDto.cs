namespace tagApiHrd.Model.Dto.legal
{
    public class ViewPacklaringDto
    {
        public string Id { get; set; } = string.Empty;

        public DateTime? Tanggal { get; set; }

        public string? Nomor { get; set; }

        public string? NoKtp { get; set; }

        public string? Nik { get; set; }

        public string? NamaKaryawan { get; set; }

        public string? Divisi { get; set; }

        public DateTime? Masuk { get; set; }

        public DateTime? Keluar { get; set; }

        public string? Hrd { get; set; }

        public string? KdCabang { get; set; }

        public string? NmCabang { get; set; }

        public string? Jenis { get; set; }

        public int Status { get; set; }

        // 🔥 OPTIONAL (kalau mau tampil lama kerja)
        public int? LamaKerjaHari
        {
            get
            {
                if (Masuk.HasValue && Keluar.HasValue)
                    return (Keluar.Value - Masuk.Value).Days;

                return null;
            }
        }
    }
}
