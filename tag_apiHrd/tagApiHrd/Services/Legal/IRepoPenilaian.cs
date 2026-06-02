using tagApiHrd.Model;
using tagApiHrd.Model.Dto;
using tagApiHrd.Model.Dto.legal;

namespace tagApiHrd.Services.Legal
{
    public interface IRepoPenilaian
    {
        Task<PagedResult<ViewEvaluasiKontrakDto>> GetListEvaluasiKontrak(
            string? nik,
            string? namaKaryawan,
            string? kdCabang,
            DateTime? tglAwal,
            DateTime? tglAkhir,
            int page,
            int pageSize
        );

        Task<FormEvaluasiKontrakDto?> GetDetailEvaluasiKontrak(string noTran);

        Task<ApiResponse<object>> SaveEvaluasiKontrak(FormEvaluasiKontrakDto dto);

        Task<ApiResponse<object>> DeleteEvaluasiKontrak(string noTran);


        Task<PagedResult<ViewApprovalEvaluasiDto>> AprovalEvaluasi(
        string? namaKaryawan,
        string? kdCabang,
        DateTime? tglAwal,
        DateTime? tglAkhir,
        string? keputusan,
        int page,
        int pageSize);

        Task<ApiResponse<object>> UpdateAprovalEvaluasi(
        FormApprovalEvaluasiDto dto);
    }
}
