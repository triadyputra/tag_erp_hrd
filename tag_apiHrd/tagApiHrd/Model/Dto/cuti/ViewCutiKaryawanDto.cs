namespace tagApiHrd.Model.Dto.cuti
{
    public class ViewCutiKaryawanDto
    {
        public string NoCuti { get; set; } = "";
        public DateTime Tanggal { get; set; }
        public string Nik { get; set; } = "";
        public string NamaKaryawan { get; set; } = "";
        public string Keperluan { get; set; } = "";
        public string? ValidUser { get; set; }
        public string? Status { get; set; }
        public string? JmlHari { get; set; }
    }
}
