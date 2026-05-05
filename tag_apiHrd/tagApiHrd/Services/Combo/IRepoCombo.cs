

using tagApiHrd.Model.Dto;
using tagApiHrd.Model.Dto.legal;

namespace tagApi.Services.Combo
{
    public interface IRepoCombo
    {
        Task<string> GetCabangAsync(string cabang, string? token=null);


        public Task<IEnumerable<ComboViewModel>> ComboCabang();
        public Task<IEnumerable<ComboViewModel>> ComboCabangWithPusat();
        public Task<IEnumerable<ComboViewModel>> ComboBank();
        public Task<IEnumerable<ComboViewModel>> ComboVendor();
        public Task<List<ViewLookupMasterKtp>> ListMasterPegawai(string? nama, string? kdcabang);



        public Task<IEnumerable<ComboViewModel>> ComboDivisi();
        public Task<IEnumerable<ComboViewModel>> ComboBagian(string divisi);
        public Task<IEnumerable<ComboViewModel>> ComboSubBagian(string bagian);
        public Task<IEnumerable<ComboViewModel>> ComboJabatan();
        public Task<IEnumerable<ComboViewModel>> ComboKategoriGaji();
        public Task<IEnumerable<ComboViewModel>> ComboJenisGaji();
       
        
        public Task<IEnumerable<ViewAspekPenilaianDto>> ListAspekPenilaian();

        Task<ViewMasterPegawaiDto?> GetDetailMasterPegawai(string cniksistag);


    }
}
