using Microsoft.Data.SqlClient;
using System.Data;

namespace tagApi.Data
{
    public class DapperSistagContext
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;
        public DapperSistagContext(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("SistagConnection");
        }
        public IDbConnection CreateConnection()
            => new SqlConnection(_connectionString);
    }
}
