namespace tagApiHrd.Model.Dto.cuti
{
    public class CutiSummaryDto
    {
        public int Saldo { get; set; }
        public int Terpakai { get; set; }
        public int Sisa { get; set; }
        public int JumlahPengajuan { get; set; }
    }

    public class CutiDetailDto
    {
        public string NoCuti { get; set; }
        public DateTime TglCuti { get; set; }
        public int Nhari { get; set; }
        public string Keterangan { get; set; }
        public int Status { get; set; }
    }

    public class CutiKaryawanDetailResponse
    {
        public CutiSummaryDto Summary { get; set; }
        public List<CutiDetailDto> Detail { get; set; }
    }
}
