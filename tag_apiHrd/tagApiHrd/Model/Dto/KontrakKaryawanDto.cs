namespace tagApiHrd.Model.Dto
{
    public class KontrakKaryawanDto
    {
        public string? NOKTP { get; set; }
        public string? NMKARYAWAN { get; set; }
        public string? TEMPATLAHIR { get; set; }
        public DateTime? TGLLAHIR { get; set; }
        public string? ALAMAT { get; set; }
        public string? KELAMIN { get; set; }
        public string? PERKAWINAN { get; set; }
        public string? PENDIDIKAN { get; set; }
        public string? AGAMA { get; set; }
        public string? KDCABANG { get; set; }
        public string? NMCABANG { get; set; }
        public string? NIKSISTAG { get; set; }
        public string? IDFINGER { get; set; }
        public string? NMBANK { get; set; }
        public string? NOREKENING { get; set; }
        public string? NOHANDPHONE { get; set; }
        public DateTime? TGLMASUK { get; set; }
        public DateTime? TGLINPUT { get; set; }
        public string? NOKONTRAK { get; set; }
        public string? KDDIVISI { get; set; }
        public string? NMDIVISI { get; set; }
        public string? KDBAGIAN { get; set; }
        public string? NMBAGIAN { get; set; }
        public string? KDSUBBAGIAN { get; set; }
        public string? NMSUBBAGIAN { get; set; }
        public string? KDJABATAN { get; set; }
        public string? NMJABATAN { get; set; }
        public DateTime? PAWAL { get; set; }
        public DateTime? PAKHIR { get; set; }
        public string? NMPERUSAHAAN { get; set; }
        public string? JNSKONTRAK { get; set; }
        public string? KATEGORIGAJI { get; set; }
        public string? JNSGAJI { get; set; }
        public string? NONPWP { get; set; }
        public string? PPH21 { get; set; }
        public bool? ISJAMINANBPJS { get; set; }
        public string? NOBPJSTK { get; set; }
        public string? NOBPJSKSH { get; set; }
        public string? NOBPJSJHT { get; set; }
        public string? NOSURATTUGAS { get; set; }
        public byte[]? FOTO { get; set; }
        public string? FOTO_BASE64 { get; set; }
        public string? KETERANGAN { get; set; }
        public string? PERIODE { get; set; }
        public string? VALIDUSER { get; set; }


        // 🔥 hasil base64
        public int Status { get; set; }
        public string? SIGNATURE_BASE64 { get; set; }
    }
}
