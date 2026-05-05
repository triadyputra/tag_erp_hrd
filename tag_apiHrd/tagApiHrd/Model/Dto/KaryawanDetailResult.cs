namespace tagApiHrd.Model.Dto
{
    public class KaryawanDetailResult
    {
        public KaryawanProfile? Profile { get; set; }
        public List<KaryawanKontrak> Kontrak { get; set; } = new();
        public List<KaryawanSP> SP { get; set; } = new();
    }

    public class KaryawanProfile
    {
        public string? NOKTP { get; set; }
        public string? NAMALENGKAP { get; set; }
        public string? KELAMIN { get; set; }
        public DateTime? TGLLAHIR { get; set; }
        public string? ALAMAT { get; set; }
        public DateTime? TGLMASUK { get; set; }
        //public string? FOTO { get; set; }
        public byte[]? FOTO { get; set; }

        public string? FOTO_BASE64 { get; set; } // 🔥 untuk frontend
        public DateTime? ResignDate { get; set; }
        public string? NMVENDOR { get; set; }
    }

    public class KaryawanKontrak
    {
        public DateTime? TGLINPUT { get; set; }
        public string? NOKONTRAK { get; set; }
        public string? NIKSISTAG { get; set; }
        public string? JNSKONTRAK { get; set; }
        public DateTime? PAWAL { get; set; }
        public DateTime? PAKHIR { get; set; }
        public DateTime? BEGINDATE { get; set; }
        public string? NMDIVISI { get; set; }
        public string? NMBAGIAN { get; set; }
        public string? NMJABATAN { get; set; }
        public string? NMCABANG { get; set; }
        public string? KETERANGAN { get; set; }
        public string? NMVENDOR { get; set; }
        public int Status { get; set; }
    }

    public class KaryawanSP
    {
        public DateTime? TGLPELANGGARAN { get; set; }
        public string? NOTRAN { get; set; }
        public string? NMATASAN { get; set; }
        public string? PELANGGARANHRD { get; set; }
        public string? SANKSIHRD { get; set; }
        public string? CATATANHRD { get; set; }
        public string? APPROVEDBY { get; set; }
    }
}
