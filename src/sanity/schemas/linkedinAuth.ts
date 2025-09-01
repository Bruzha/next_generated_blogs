export default {
  name: 'linkedinAuth',
  type: 'document',
  title: 'LinkedIn Auth',
  fields: [
    {
      name: 'accessToken',
      type: 'string',
      title: 'Access Token'
    },
    {
      name: 'refreshToken',
      type: 'string',
      title: 'Refresh Token'
    },
    {
      name: 'expiresAt',
      type: 'datetime',
      title: 'Expires At'
    }
  ]
}
