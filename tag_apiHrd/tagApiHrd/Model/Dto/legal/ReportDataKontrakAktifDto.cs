namespace tagApiHrd.Model.Dto.legal
{
    public class ReportDataKontrakAktifDto
    {
        public string? NOKTP { get; set; }
        public string? NIKSISTAG { get; set; }
        public string? NMKARYAWAN { get; set; }
        public string? IDFINGER { get; set; }
        public string? ALAMAT { get; set; }

        public string? JNSKONTRAK { get; set; }
        public string? NOKONTRAK { get; set; }

        public string? NMDIVISI { get; set; }
        public string? NMBAGIAN { get; set; }
        public string? NMJABATAN { get; set; }

        public DateTime? PAWAL { get; set; }
        public DateTime? PAKHIR { get; set; }

        public DateTime? TMT { get; set; }
        public DateTime? TGLLAHIR { get; set; }

        public string? KDCABANG { get; set; }
        public string? NMCABANG { get; set; }
        public string? UMUR { get; set; }
        public string? PENDIDIKAN { get; set; }
        public string? SEX { get; set; }

        public int? SISA_KONTRAK { get; set; }
    }
}
