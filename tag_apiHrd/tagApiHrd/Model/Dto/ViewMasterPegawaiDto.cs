namespace tagApiHrd.Model.Dto
{
    public class ViewMasterPegawaiDto
    {
        public string? NoKtp { get; set; }
        public string? NmKaryawan { get; set; }
        public string? IdFinger { get; set; }
        public string? NikSistag { get; set; }

        public string? JnsKontrak { get; set; }
        public string? NoKontrak { get; set; }

        public DateTime? Tmt { get; set; }
        public DateTime? PAwal { get; set; }
        public DateTime? PAkhir { get; set; }
        public DateTime? BeginDate { get; set; }
        public DateTime? EndDate { get; set; }

        public string? KdDivisi { get; set; }
        public string? NmDivisi { get; set; }

        public string? KdBagian { get; set; }
        public string? NmBagian { get; set; }

        public string? KdSubBagian { get; set; }
        public string? NmSubBagian { get; set; }

        public string? KdJabatan { get; set; }
        public string? NmJabatan { get; set; }

        public string? Kelamin { get; set; }
        public string? Perkawinan { get; set; }
        public string? Agama { get; set; }
        public string? Pendidikan { get; set; }

        public string? TempatLahir { get; set; }
        public DateTime? TglLahir { get; set; }

        public string? AlamatKtp { get; set; }
        public string? AlamatTinggal { get; set; }

        public string? KdCabang { get; set; }
        public string? NmCabang { get; set; }

        public string? NmVendor { get; set; }
        public string? KatKontrak { get; set; }
    }
}
