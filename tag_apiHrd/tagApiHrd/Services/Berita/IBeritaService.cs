using tagApiHrd.Model;
using tagApiHrd.Model.Dto;
using tagApiHrd.Model.Dto.Berita;

namespace tagApiHrd.Services.Berita
{
    public interface IBeritaService
    {
        Task<PagedResult<BeritaView>> GetListBerita(
            string? judul,
            bool? isPinned,
            int page,
            int pageSize);

        Task<BeritaView?> GetDetailBerita(
            int id);

        Task<ApiResponse<object>> SaveBerita(
            BeritaDto dto,
            string validUser);

        Task<ApiResponse<object>> DeleteBerita(
            int id);

        Task<string?> GetExistingGambar(
            int id);



        Task<List<BeritaView>> GetTopBerita();
    }
}
