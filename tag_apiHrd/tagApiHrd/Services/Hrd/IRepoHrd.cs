

using tagApiHrd.Model;
using tagApiHrd.Model.Dto;
using tagApiHrd.Model.Dto.cuti;

namespace tagApi.Services.Hrd
{
    public interface IRepoHrd
    {
        Task<PagedResult<ViewKontrakAktif>> GetKontrakAktif(
            string? noKontrak,
            string? namaKaryawan,
            string? jenisKontrak,
            string? cabang,
            string? sisaKontrak,
            int page,
            int pageSize
        );

        Task<List<ViewFIlterKaryawan>> GetFilterKaryawan(
            string? nama,
            string? cabang
        );

        Task<KaryawanDetailResult> GetDetailKaryawan(string noktp);

        Task<PagedResult<KontrakKaryawanDto>> GetListKontrakKaryawan(
            DateTime? tglAwal,
            DateTime? tglAkhir,
            string? kdCabang,
            string? namaKaryawan,
            string? perusahaan,
            int page,
            int pageSize
        );

        Task<KontrakKaryawanDto?> GetDetailKontrakByKtp(string noktp);
        Task<KontrakKaryawanDto?> GetDetailKontrak(string noKontrak);

        Task<(string regCode, string nomorNik)> AddOrUpdateKontrakAsync(
            KontrakKaryawanDto model
        );

        Task<bool> DeleteKontrakAsync(string noKontrak, string noKtp, string user);

        Task<int> UpdateStatusTtd(string noKontrak);


        #region cuti
        Task<PagedResult<ViewSaldoCutiKaryawan>> GetSaldoCutiKaryawan(
        int? tahun,
        string? cabang,
        string? nama,
        int page,
        int pageSize);

        Task<CutiKaryawanDetailResponse> GetDetailCutiAsync(string noktp, int? tahun);

        Task<PagedResult<ViewCutiKaryawanDto>> GetListCutiAsync(DateTime? tglAwal,
            DateTime? tglAkhir,
            string? nama,
            string? cabang,
            int page,
            int pageSize);

        Task<FormCutiKaryawan?> GetDetailCutiFormAsync(string noCuti);

        Task<SpResult> SaveCutiAsync(FormCutiKaryawan request);

        Task<SpResult> DeleteCutiAsync(string noCuti, string validUser);
        #endregion
    }
}
