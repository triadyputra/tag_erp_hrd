using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using tagApi.Filter;
using tagApiHrd.Model.Dto;
using tagApiHrd.Model.Dto.Berita;
using tagApiHrd.Services.Berita;

namespace tagApiHrd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BeritaController : ControllerBase
    {
        private readonly IBeritaService _beritaService;
        private readonly IWebHostEnvironment _env;

        public BeritaController(
            IBeritaService beritaService,
            IWebHostEnvironment env)
        {
            _beritaService = beritaService;
            _env = env;
        }

        // =====================================
        // GET LIST
        // =====================================
        [ApiKeyAuthorize]
        [HttpGet("GetListBerita")]
        public async Task<IActionResult> GetListBerita(
            [FromQuery] string? judul,
            [FromQuery] bool? isPinned,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var result =
                    await _beritaService.GetListBerita(
                        judul,
                        isPinned,
                        page,
                        pageSize
                    );

                return Ok(
                    ApiResponse<object>.Success(
                        result,
                        "Berhasil mengambil data berita"
                    )
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    ApiResponse<object>.Error(
                        ex.Message,
                        "500"
                    )
                );
            }
        }

        // =====================================
        // GET DETAIL
        // =====================================
        [ApiKeyAuthorize]
        [HttpGet("GetDetailBerita/{id}")]
        public async Task<IActionResult> GetDetailBerita(
            int id)
        {
            try
            {
                var result =
                    await _beritaService.GetDetailBerita(id);

                if (result == null)
                {
                    return NotFound(
                        ApiResponse<object>.Error(
                            "Data berita tidak ditemukan",
                            "404"
                        )
                    );
                }

                return Ok(
                    ApiResponse<object>.Success(
                        result,
                        "Berhasil mengambil detail berita"
                    )
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    ApiResponse<object>.Error(
                        ex.Message,
                        "500"
                    )
                );
            }
        }

        // =====================================
        // SAVE
        // =====================================
        [ApiKeyAuthorize]
        [HttpPost("SaveBerita")]
        public async Task<IActionResult> SaveBerita(
        [FromBody] BeritaDto dto)
        {
            try
            {
                var validUser =
                    User?.Identity?.Name ?? "SYSTEM";

                // =====================================
                // UPDATE: CEK GAMBAR LAMA
                // =====================================
                if (dto.Id > 0)
                {
                    var existingGambar =
                        await _beritaService.GetExistingGambar(dto.Id);

                    // Jika gambar baru adalah base64 (ada perubahan)
                    if (!string.IsNullOrWhiteSpace(dto.Gambar) &&
                        !dto.Gambar.StartsWith("/upload/"))
                    {
                        // Hapus gambar lama jika ada
                        if (!string.IsNullOrWhiteSpace(existingGambar))
                        {
                            DeleteGambarFile(existingGambar);
                        }

                        // Simpan gambar baru
                        dto.Gambar = SaveGambarFile(dto.Gambar);
                    }
                    else
                    {
                        // Tidak ada perubahan gambar, pakai yang lama
                        dto.Gambar = existingGambar ?? string.Empty;
                    }
                }
                else
                {
                    // =====================================
                    // INSERT: SIMPAN BASE64 KE FILE
                    // =====================================
                    if (!string.IsNullOrWhiteSpace(dto.Gambar) &&
                        !dto.Gambar.StartsWith("/upload/"))
                    {
                        dto.Gambar = SaveGambarFile(dto.Gambar);
                    }
                }

                var result =
                    await _beritaService.SaveBerita(
                        dto,
                        validUser
                    );

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(
                    ApiResponse<object>.Error(
                        ex.InnerException?.Message ?? ex.Message,
                        "500"
                    )
                );
            }
        }

        // =====================================
        // HELPER: SIMPAN GAMBAR
        // =====================================
        private string SaveGambarFile(string base64Image)
        {
            var folderPath = Path.Combine(
                _env.WebRootPath,
                "upload",
                "berita"
            );

            if (!Directory.Exists(folderPath))
            {
                Directory.CreateDirectory(folderPath);
            }

            byte[] imageBytes =
                Convert.FromBase64String(base64Image);

            var fileName =
                $"{Guid.NewGuid()}.png";

            var filePath =
                Path.Combine(folderPath, fileName);

            System.IO.File.WriteAllBytesAsync(
                filePath,
                imageBytes
            ).Wait();

            return $"/upload/berita/{fileName}";
        }

        // =====================================
        // HELPER: HAPUS GAMBAR
        // =====================================
        private void DeleteGambarFile(string gambarPath)
        {
            if (string.IsNullOrWhiteSpace(gambarPath))
                return;

            var relativePath =
                gambarPath
                    .TrimStart('/')
                    .Replace("/", Path.DirectorySeparatorChar.ToString());

            var fullPath =
                Path.Combine(
                    _env.WebRootPath,
                    relativePath
                );

            if (System.IO.File.Exists(fullPath))
            {
                System.IO.File.Delete(fullPath);
            }
        }

        // =====================================
        // DELETE
        // =====================================
        [ApiKeyAuthorize]
        [HttpDelete("DeleteBerita/{id}")]
        public async Task<IActionResult> DeleteBerita(
        int id)
        {
            try
            {
                var result =
                    await _beritaService.DeleteBerita(id);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(
                    ApiResponse<object>.Error(
                        ex.Message,
                        "500"
                    )
                );
            }
        }
    }
}
