namespace tagApiHrd.Model.Dto.mobile
{
    public class CutiMobileRequest
    {
        public string NIK { get; set; } = "";
        public string JnsCuti { get; set; } = "";
        public string Keperluan { get; set; } = "";
        public List<DateTime> TanggalCuti { get; set; } = new();
    }
}
