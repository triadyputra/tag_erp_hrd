namespace tagApiHrd.Model.Dto.legal
{
    public class FormEvaluasiKontrakDto
    {
        public string? NoTran { get; set; }

        public string? Nip { get; set; }
        public string? Nik { get; set; }
        public string? NoKontrak { get; set; }
        public string? NamaKaryawan { get; set; }

        public DateTime? TglLahir { get; set; }
        public string? Usia { get; set; }

        public string? KdDepartemen { get; set; }
        public string? KdBagian { get; set; }
        public string? KdJabatan { get; set; }

        public DateTime? TglMasuk { get; set; }
        public DateTime? TglHabisKontrak { get; set; }

        public string? NikAtasan { get; set; }
        public string? NamaAtasan { get; set; }

        public DateTime? TglNilai { get; set; }

        public DateTime? PAwal { get; set; }
        public DateTime? PAkhir { get; set; }

        public double Nilai { get; set; }

        public string? Rekomendasi { get; set; }
        public string? Catatan { get; set; }

        public string? ValidUser { get; set; }
        public string? KdCabang { get; set; }

        public List<FormEvaluasiKontrakDetailDto> Details { get; set; } = new();
    }

    public class FormEvaluasiKontrakDetailDto
    {
        public string? GrupAspek { get; set; }
        public string? KdAspek { get; set; }
        public double Nilai { get; set; }
    }
}
