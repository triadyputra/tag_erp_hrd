namespace tagApiHrd.Model.Dto
{
    public class ViewKontrakAktif
    {
        public string? NoKtp { get; set; }
        public string? NikSistag { get; set; }
        public string? NmKaryawan { get; set; }
        public string? IdFinger { get; set; }
        public string? JnsKontrak { get; set; }
        public string? NoKontrak { get; set; }
        public string? NmDivisi { get; set; }
        public string? NmBagian { get; set; }
        public string? NmJabatan { get; set; }

        public DateTime? PAwal { get; set; }
        public DateTime? PAkhir { get; set; }
        public DateTime? Tmt { get; set; }
        public DateTime? TglLahir { get; set; }

        public string? KdCabang { get; set; }
        public int SISA_KONTRAK { get; set; }
    }
}
