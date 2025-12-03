// src/app/api/auth/linkedin/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  console.log("code: ", code);

  if (error) {
    return new NextResponse('Authorization error', { status: 400 });
  }

  if (!code) {
    return new NextResponse('No authorization code', { status: 400 });
  }

  try {
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URL!,
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

    //const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // // 3. Сохраняем в Sanity
    // await client.createOrReplace({
    //   _id: 'linkedinAuth',
    //   _type: 'linkedinAuth',
    //   accessToken: access_token,
    //   refreshToken: refresh_token || '',
    //   expiresAt
    // });

    const response = NextResponse.redirect(new URL('/', req.url));
    response.cookies.set('linkedin_token', access_token, {
      httpOnly: true,
      secure: true,
      maxAge: expires_in,
      path: '/',
      sameSite: 'none',
    });

    return response;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error(err.response?.data || err.message);
    return new NextResponse('Error getting token', { status: 500 });
  }
}
