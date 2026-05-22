using Dapper;
using System.Data;
using tagApi.Data;
using tagApiHrd.Model;
using tagApiHrd.Model.Dto;
using tagApiHrd.Model.Dto.Berita;

namespace tagApiHrd.Services.Berita
{
    public class BeritaService : IBeritaService
    {
        private readonly DapperSistagHrdContext _context;
        private readonly IWebHostEnvironment _env;

        public BeritaService(DapperSistagHrdContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // =====================================
        // GET LIST
        // =====================================
        // =====================================
        // GET LIST
        // =====================================
        public async Task<PagedResult<BeritaView>> GetListBerita(
            string? judul,
            bool? isPinned,
            int page,
            int pageSize)
        {
            try
            {
                if (page < 1)
                    page = 1;

                if (pageSize < 1)
                    pageSize = 10;

                if (pageSize > 100)
                    pageSize = 100;

                var offset = (page - 1) * pageSize;

                using var connection =
                    _context.CreateConnection();

                var sql = @"
                SELECT COUNT(1)
                FROM dbo.berita
                WHERE
                    (@Judul IS NULL OR judul LIKE '%' + @Judul + '%')
                    AND (@IsPinned IS NULL OR is_pinned = @IsPinned);

                SELECT
                    id           AS Id,
                    judul        AS Judul,
                    slug         AS Slug,
                    isi          AS Isi,
                    status       AS Status,
                    gambar       AS Gambar,
                    is_pinned    AS IsPinned,
                    created_at   AS CreatedAt,
                    updated_at   AS UpdatedAt
                FROM dbo.berita
                WHERE
                    (@Judul IS NULL OR judul LIKE '%' + @Judul + '%')
                    AND (@IsPinned IS NULL OR is_pinned = @IsPinned)
                ORDER BY
                    is_pinned DESC,
                    created_at DESC
                OFFSET @Offset ROWS
                FETCH NEXT @PageSize ROWS ONLY;
                ";

                var param = new
                {
                    Judul =
                        string.IsNullOrWhiteSpace(judul)
                            ? null
                            : judul,

                    IsPinned = isPinned,

                    Offset = offset,

                    PageSize = pageSize
                };

                using var multi =
                    await connection.QueryMultipleAsync(
                        sql,
                        param,
                        commandType: CommandType.Text
                    );

                var total =
                    await multi.ReadFirstAsync<int>();

                var data =
                    (await multi.ReadAsync<BeritaView>())
                    .ToList();

                return new PagedResult<BeritaView>
                {
                    Data = data,
                    Total = total
                };
            }
            catch (Exception ex)
            {
                throw new Exception(
                    $"Gagal mengambil data berita. {ex.Message}",
                    ex
                );
            }
        }

        // =====================================
        // GET DETAIL
        // =====================================
        public async Task<BeritaView?> GetDetailBerita(
            int id)
        {
            try
            {
                using var connection =
                    _context.CreateConnection();

                const string sql = @"
                SELECT
                    id              AS Id,
                    judul           AS Judul,
                    slug            AS Slug,
                    isi             AS Isi,
                    status          AS Status,
                    gambar          AS Gambar,
                    is_pinned       AS IsPinned,
                    created_at      AS CreatedAt,
                    updated_at      AS UpdatedAt
                FROM dbo.berita
                WHERE id = @id
                ";

                return await connection
                    .QueryFirstOrDefaultAsync<BeritaView>(
                        sql,
                        new { id });
            }
            catch (Exception ex)
            {
                throw new Exception(
                    $"Gagal mengambil detail berita. {ex.Message}",
                    ex
                );
            }
        }

        // =====================================
        // SAVE
        // =====================================
        public async Task<ApiResponse<object>> SaveBerita(
        BeritaDto dto,
        string validUser)
                {
                    try
                    {
                        using var connection =
                            _context.CreateConnection();

                        // =====================================
                        // INSERT
                        // =====================================
                        if (dto.Id == 0)
                        {
                        const string insertQuery = @"
                        INSERT INTO dbo.berita
                        (
                            judul,
                            slug,
                            isi,
                            status,
                            gambar,
                            is_pinned,
                            created_at,
                            updated_at
                        )
                        VALUES
                        (
                            @Judul,
                            @Slug,
                            @Isi,
                            @Status,
                            @Gambar,
                            @IsPinned,
                            GETDATE(),
                            GETDATE()
                        );

                        SELECT CAST(SCOPE_IDENTITY() as int);
                        ";

                        var insertedId =
                                await connection.ExecuteScalarAsync<int>(
                                    insertQuery,
                                    new
                                    {
                                        dto.Judul,
                                        dto.Slug,
                                        dto.Isi,
                                        dto.Status,
                                        dto.Gambar,
                                        dto.IsPinned
                                    }
                                );

                            return ApiResponse<object>.Success(
                                new
                                {
                                    Id = insertedId,
                                    dto.Judul
                                },
                                "Berita berhasil ditambahkan"
                            );
                        }

                        // =====================================
                        // UPDATE
                        // =====================================
                        const string updateQuery = @"
                        UPDATE dbo.berita
                        SET
                            judul = @Judul,
                            slug = @Slug,
                            isi = @Isi,
                            status = @Status,
                            gambar = @Gambar,
                            is_pinned = @IsPinned,
                            updated_at = GETDATE()
                        WHERE id = @Id
                        ";

                        var affectedRows =
                            await connection.ExecuteAsync(
                                updateQuery,
                               new
                               {
                                   dto.Id,
                                   dto.Judul,
                                   dto.Slug,
                                   dto.Isi,
                                   dto.Status,
                                   dto.Gambar,
                                   dto.IsPinned
                               }
                            );

                        if (affectedRows == 0)
                        {
                            return ApiResponse<object>.Error(
                                "Data berita tidak ditemukan",
                                "404"
                            );
                        }

                        return ApiResponse<object>.Success(
                            new
                            {
                                dto.Id,
                                dto.Judul
                            },
                            "Berita berhasil diupdate"
                        );
                    }
                    catch (Exception ex)
                    {
                        return ApiResponse<object>.Error(
                            ex.InnerException?.Message ?? ex.Message,
                            "500"
                        );
                    }
        }

        // =====================================
        // DELETE
        // =====================================
        public async Task<ApiResponse<object>> DeleteBerita(int id)
        {
            try
            {
                using var connection =
                    _context.CreateConnection();

                // =====================================
                // AMBIL DATA GAMBAR
                // =====================================
                var berita =
                    await connection.QueryFirstOrDefaultAsync<BeritaDto>(
                        @"
                SELECT
                    id            AS Id,
                    gambar        AS Gambar
                FROM dbo.berita
                WHERE id = @id
                ",
                        new { id }
                    );

                if (berita == null)
                {
                    return ApiResponse<object>.Error(
                        "Data berita tidak ditemukan",
                        "404"
                    );
                }

                // =====================================
                // HAPUS FILE GAMBAR
                // =====================================
                if (!string.IsNullOrWhiteSpace(berita.Gambar))
                {
                    var relativePath =
                        berita.Gambar
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
                // HAPUS DATA DATABASE
                // =====================================
                var affectedRows =
                    await connection.ExecuteAsync(
                        @"
                DELETE FROM dbo.berita
                WHERE id = @id
                ",
                        new { id }
                    );

                if (affectedRows > 0)
                {
                    return ApiResponse<object>.Success(
                        new
                        {
                            Id = id
                        },
                        "Berita berhasil dihapus"
                    );
                }

                return ApiResponse<object>.Error(
                    "Gagal menghapus berita",
                    "400"
                );
            }
            catch (Exception ex)
            {
                return ApiResponse<object>.Error(
                    ex.InnerException?.Message ?? ex.Message,
                    "500"
                );
            }
    }

        // =====================================
        // GET EXISTING GAMBAR
        // =====================================
        public async Task<string?> GetExistingGambar(
            int id)
        {
            try
            {
                using var connection =
                    _context.CreateConnection();

                const string sql = @"
                SELECT gambar
                FROM dbo.berita
                WHERE id = @id
                ";

                return await connection
                    .QueryFirstOrDefaultAsync<string>(
                        sql,
                        new { id });
            }
            catch (Exception ex)
            {
                throw new Exception(
                    $"Gagal mengambil gambar berita. {ex.Message}",
                    ex
                );
            }
        }



        public async Task<List<BeritaView>> GetTopBerita()
        {
            try
            {
                using var connection =
                    _context.CreateConnection();

                const string sql = @"
                SELECT TOP 20
                    id            AS Id,
                    judul         AS Judul,
                    slug          AS Slug,
                    isi           AS Isi,
                    status        AS Status,
                    gambar        AS Gambar,
                    is_pinned     AS IsPinned,
                    created_at    AS CreatedAt,
                    updated_at    AS UpdatedAt
                FROM dbo.berita
                WHERE ISNULL(status,1) = 1
                ORDER BY
                    is_pinned DESC,
                    created_at DESC
                ";

                var data =
                    await connection.QueryAsync<BeritaView>(
                        sql
                    );

                return data.ToList();
            }
            catch (Exception ex)
            {
                throw new Exception(
                    $"Gagal mengambil berita. {ex.Message}",
                    ex
                );
            }
        }

    }
}
