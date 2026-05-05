using tagApiHrd.Model;
using tagApiHrd.Model.Dto;
using tagApiHrd.Model.Dto.legal;

namespace tagApiHrd.Services.Legal
{
    public interface IRepoPacklaring
    {
        Task<PagedResult<ViewPacklaringDto>> GetPacklaringList(
            string? nomor,
            string? nama,
            string? jenis,
            string? cabang,
            DateTime? tglAwal,
            DateTime? tglAkhir,
            int page,
            int pageSize
        );

        Task<PacklaringDto?> GetDetailPacklaring(string Id);

        Task<string> SavePacklaring(PacklaringDto model, string user);

        Task<bool> DeletePacklaring(string id);


        Task<List<PacklaringDto>> GetListPacklaringByNik(string NoKtp);
    }
}
