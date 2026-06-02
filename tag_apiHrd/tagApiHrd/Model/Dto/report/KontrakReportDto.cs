namespace tagApiHrd.Model.Dto.report

{

    public class KontrakReportDto

    {

        public string NoKontrak { get; set; }

        public string NikSistag { get; set; }

        public string NamaKaryawan { get; set; }

        public string NoKtp { get; set; }

        public string Alamat { get; set; }

        public string Telepon { get; set; }

        public string TempatLahir { get; set; }

        public DateTime? TanggalLahir { get; set; }

        public string JenisKelamin { get; set; }

        public string Agama { get; set; }

        public string Status { get; set; }

        public string Jabatan { get; set; }

        public string? NmBagian { get; set; }

        public DateTime? TglMulai { get; set; }

        public DateTime? TglSelesai { get; set; }



        public string? Pasal1 { get; set; }

        public string? Pasal2 { get; set; }

        public string? Pasal3 { get; set; }



        public string? NmPerusahaan { get; set; }
        public string? LOGO_BASE64 { get; set; }
        public string? SIGNATURE_BASE64 { get; set; }
        public string? HRD_SIGNATURE_BASE64 { get; set; }
        public int StatusTtd { get; set; }

    }

}


