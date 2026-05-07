using tagApiHrd.Model;
using tagApiHrd.Model.Dto;
using tagApiHrd.Model.Dto.master;

namespace tagApiHrd.Services.master
{
    public interface IRepoMasterKtp
    {
        Task<PagedResult<FormDataKtpDto>> GetListDataKtp(
        string? noktp,
        string? namaLengkap,
        string? kdCabang,
        int page,
        int pageSize);

        Task<FormDataKtpDto?> GetDetailDataKtp(string noktp);

        Task<ApiResponse<object>> SaveDataKtp(
        FormDataKtpDto dto,
        string validUser);

        Task<ApiResponse<object>> DeleteDataKtp(string noktp);
    }
}
