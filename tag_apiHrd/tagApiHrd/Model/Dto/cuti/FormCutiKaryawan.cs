namespace tagApiHrd.Model.Dto.cuti
{
    public class FormCutiKaryawan
    {
        public string? NoCuti { get; set; }
        public DateTime Tanggal { get; set; }
        public string NikKaryawan { get; set; } = "";
        public string NmKaryawan { get; set; } = "";
        public string KdDivisi { get; set; } = "";
        public string NmDivisi { get; set; } = "";
        public string KdBagian { get; set; } = "";
        public string NmBagian { get; set; } = "";
        public string KdSubBagian { get; set; } = "";
        public string NmSubBagian { get; set; } = "";
        public string KdJabatan { get; set; } = "";
        public string NmJabatan { get; set; } = "";
        public string Alamat { get; set; } = "";
        public string Telepon { get; set; } = "";
        public string JnsCuti { get; set; } = "";
        public float JmlHari { get; set; }
        public string Keperluan { get; set; } = "";
        public string Catatan { get; set; } = "";
        public float HakCuti { get; set; }
        public float Terpakai { get; set; }
        public float SisaCuti { get; set; }
        public string KdCabang { get; set; } = "";
        public string ValidUser { get; set; } = "";
        public int Status { get; set; } = 1;

        public List<DateTime> DetailTanggal { get; set; } = new();
    }

    public class SpResult
    {
        public string Code { get; set; } = "";
        public string Message { get; set; } = "";
        public string? NoCuti { get; set; }
    }
}
