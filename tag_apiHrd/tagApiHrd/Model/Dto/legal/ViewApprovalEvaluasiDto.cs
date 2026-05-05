namespace tagApiHrd.Model.Dto.legal
{
    public class ViewApprovalEvaluasiDto
    {
        public string? KdCabang { get; set; }
        public string? NmCabang { get; set; }

        public string? NoTran { get; set; }
        public string? NoKontrak { get; set; }

        public string? Nip { get; set; }
        public string? NmKaryawan { get; set; }

        public string? NmDivisi { get; set; }
        public string? NmBagian { get; set; }
        public string? NmJabatan { get; set; }

        public DateTime? TglMasuk { get; set; }

        public DateTime? PAwal { get; set; }
        public DateTime? PAkhir { get; set; }

        public double Nilai { get; set; }

        public string? Rekomendasi { get; set; }
        public string? Catatan { get; set; }

        public string? NmAtasan { get; set; }

        public string? CatatanHrd { get; set; }
        public string? Keputusan { get; set; }
    }
}
