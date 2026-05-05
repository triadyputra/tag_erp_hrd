using Dapper;
using System.Data;
using System.Data.SqlClient;

namespace tagApi.Data
{
    public class DapperSistagHrdContext
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public DapperSistagHrdContext(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("SistagHrConnection");
        }

        public IDbConnection CreateConnection()
            => new SqlConnection(_connectionString);

        public async Task<T?> QueryFirstOrDefaultAsync<T>(string sql, object? param = null)
        {
            using var connection = CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<T>(sql, param);
        }

        public async Task<IEnumerable<T>> QueryAsync<T>(string sql, object? param = null)
        {
            using var connection = CreateConnection();
            return await connection.QueryAsync<T>(sql, param);
        }

        public async Task<int> ExecuteAsync(string sql, object? param = null)
        {
            using var connection = CreateConnection();
            return await connection.ExecuteAsync(sql, param);
        }

        public async Task<IEnumerable<T>> QueryStoredProcedureAsync<T>(string sp, object? param = null)
        {
            using var connection = CreateConnection();
            return await connection.QueryAsync<T>(sp, param, commandType: CommandType.StoredProcedure);
        }

        public async Task<int> ExecuteStoredProcedureAsync(string sp, object? param = null)
        {
            using var connection = CreateConnection();
            return await connection.ExecuteAsync(sp, param, commandType: CommandType.StoredProcedure);
        }
    }
}
