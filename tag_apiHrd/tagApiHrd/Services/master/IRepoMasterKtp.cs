using tagApiHrd.Model;
using tagApiHrd.Model.Dto;
using tagApiHrd.Model.Dto.Berita;
using tagApiHrd.Model.Dto.master;

namespace tagApiHrd.Services.master
{
    public interface IRepoMasterKtp
    {
        // ===============================
        // GET LIST
        // ===============================
        Task<PagedResult<FormDataKtpDto>> GetListDataKtp(
            string? noktp,
            string? namaLengkap,
            string? kdCabang,
            int page,
            int pageSize
        );

        // ===============================
        // GET DETAIL
        // ===============================
        Task<FormDataKtpDto?> GetDetailDataKtp(
            string noktp
        );

        // ===============================
        // SAVE
        // ===============================
        Task<ApiResponse<object>> SaveDataKtp(
            FormDataKtpDto dto,
            string ValidUser
        );

        // ===============================
        // UPDATE NOMOR KTP
        // ===============================
        Task<ApiResponse<object>> UpdateNomorKtp(
            UpdateNomorKtpDto dto
        );

        // ===============================
        // DELETE
        // ===============================
        Task<ApiResponse<object>> DeleteDataKtp(
            string noktp,
            string kdcabang
        );
    }
}
