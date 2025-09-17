var credentials = {
  credentials: {
    client_id: 'SVqtklcstUzlmsaWa2dG9AJ4gU4uVrupB7laJH2R55BP331D',
    client_secret: 'pu9XN8UUwWAcdcJCapLNRZkq5fJag6Ajoe1KS3TQ81Q0CxczKrkRpjjU9dhk6Cik',
    grant_type: 'client_credentials',
    scope: 'data:read data:write data:create bucket:create bucket:read viewables:read',
  },
  
  BaseUrl: 'https://developer.api.autodesk.com',
  Version: 'v2'
};

credentials.Authentication = `${credentials.BaseUrl}/authentication/${credentials.Version}/token`;

module.exports = credentials;