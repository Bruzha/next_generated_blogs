import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).send('Ошибка авторизации');
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).send('Нет кода авторизации');
  }

  try {
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, expires_in } = tokenResponse.data;

    // Варианты:
    // - сохранить в куки
    // - сохранить в сессии
    // - временно вывести на экран

    res.status(200).json({
      access_token,
      expires_in
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error(err.response?.data || err.message);
    res.status(500).send('Ошибка при получении токена');
  }
}
