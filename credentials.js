var credentials = {
  credentials: {
    client_id: '9OqBMB8kaFL1s2DjCzCsG74lW2TSeT2YnU59HZLXbWz6W5lF',
    client_secret: 'm5XQKoK8dXtI8L6MBMsURdAD4n2RcuzalqUFEzpQVADNkC2GPqN8mqU1oxdXtdZb',
    grant_type: 'client_credentials',
    scope: 'data:read viewables:read',
  },
  
  BaseUrl: 'https://developer.api.autodesk.com',
  Version: 'v2'
};

credentials.Authentication = `${credentials.BaseUrl}/authentication/${credentials.Version}/token`;

module.exports = credentials;
