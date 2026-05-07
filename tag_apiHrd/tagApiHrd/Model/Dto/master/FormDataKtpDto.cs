namespace tagApiHrd.Model.Dto.master
{
    public class FormDataKtpDto
    {
        public string Noktp { get; set; } = "";
        public string NamaLengkap { get; set; } = "";
        public string Kelamin { get; set; } = "";
        public string TempatLahir { get; set; } = "";
        public DateTime? TglLahir { get; set; }

        public string Alamat { get; set; } = "";
        public string AlamatTinggal { get; set; } = "";
        public string Pendidikan { get; set; } = "";
        public string Agama { get; set; } = "";
        public string Perkawinan { get; set; } = "";

        public DateTime? TglMasuk { get; set; }

        public string IdFinger { get; set; } = "";
        public string NoTelepon { get; set; } = "";
        public string TitipIjazah { get; set; } = "";

        public byte[]? Foto { get; set; }

        public string KdCabang { get; set; } = "";
        public string NmCabang { get; set; } = "";

        public string KdVendor { get; set; } = "";
        public string NmVendor { get; set; } = "";
    }
}
