using System.Text.Json.Serialization;

namespace tagApiHrd.Model.Dto
{
    public class KaryawanTetapListDto
    {
        public string? Noktp { get; set; }
        public string? NikSistag { get; set; }
        public string? NamaLengkap { get; set; }
        public string? Kelamin { get; set; }
        public string? TempatLahir { get; set; }
        public DateTime? TglLahir { get; set; }
        public string? Alamat { get; set; }
        public string? Pendidikan { get; set; }
        public string? Agama { get; set; }
        public string? Perkawinan { get; set; }
        [JsonIgnore]
        public byte[]? Foto { get; set; }
        public string? FotoBase64 { get; set; }
        public string? IdFinger { get; set; }
        public DateTime? TglMasuk { get; set; }
        public string? KdCabang { get; set; }
        public string? NmCabang { get; set; }
        public string? NmBank { get; set; }
        public string? NoRekening { get; set; }
        public string? NoTelepon { get; set; }
        public string? KdDivisi { get; set; }
        public string? NmDivisi { get; set; }
        public string? KdBagian { get; set; }
        public string? NmBagian { get; set; }
        public string? KdSubBagian { get; set; }
        public string? NmSubBagian { get; set; }
        public string? KdJabatan { get; set; }
        public string? NmJabatan { get; set; }
        public string? ValidUser { get; set; }
        public string? NoKontrak { get; set; }
        public string? NoSk { get; set; }
        public DateTime? TglSk { get; set; }
        public string? NoIm { get; set; }
        public DateTime? TglInput { get; set; }
    }
}
