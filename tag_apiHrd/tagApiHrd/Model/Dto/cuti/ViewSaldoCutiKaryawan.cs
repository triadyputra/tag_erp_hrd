namespace tagApiHrd.Model.Dto.cuti
{
    public class ViewSaldoCutiKaryawan
    {
        public string NIKSISTAG { get; set; }
        public string NMKARYAWAN { get; set; }
        public string NMDIVISI { get; set; }
        public string NMBAGIAN { get; set; }
        public string NMJABATAN { get; set; }
        public string KDCABANG { get; set; }
        public string NMCABANG { get; set; }

        public int SALDO { get; set; }
        public int TERPAKAI { get; set; }
        public int SISA { get; set; }
    }
}
