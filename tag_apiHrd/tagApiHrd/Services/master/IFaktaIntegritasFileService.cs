using Microsoft.AspNetCore.Http;

namespace tagApiHrd.Services.master
{
    public interface IFaktaIntegritasFileService
    {
        bool Exists(string noktp);

        Task SaveAsync(string noktp, IFormFile file);

        Task<string?> ReadBase64Async(string noktp);

        bool Delete(string noktp);

        string GetFileName(string noktp);
    }
}
