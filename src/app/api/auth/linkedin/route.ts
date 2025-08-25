// src/app/api/auth/linkedin/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  console.log("process.env.LINKEDIN_CLIENT_ID: ", process.env.LINKEDIN_CLIENT_ID);
  console.log("process.env.LINKEDIN_CLIENT_SECRET: ", process.env.LINKEDIN_CLIENT_SECRET);
  console.log("process.env.LINKEDIN_REDIRECT_URL: ", process.env.LINKEDIN_REDIRECT_URL);
  const state = 'random_csrf_token_example_12345';
  const scope = ['w_organization_social', 'rw_organization_admin'].join(' ');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URL!,
    scope,
    state,
  });
  const url = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  return NextResponse.redirect(url);
}
