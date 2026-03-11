import { NextRequest, NextResponse } from "next/server";
import {
  getAdminSessionCookieName,
  isAdminCredentials,
  isAdminRequest,
} from "@/lib/admin";

const ONE_DAY_IN_SECONDS = 60 * 60 * 24;

export async function GET(request: NextRequest) {
  return NextResponse.json({ isAdmin: isAdminRequest(request) });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = String(body?.username || "");
    const password = String(body?.password || "");

    if (!isAdminCredentials(username, password)) {
      return NextResponse.json(
        { error: "Kullanıcı adı veya parola hatalı" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true, isAdmin: true });
    response.cookies.set({
      name: getAdminSessionCookieName(),
      value: "1",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: ONE_DAY_IN_SECONDS,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Giriş işlemi başarısız" }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, isAdmin: false });
  response.cookies.set({
    name: getAdminSessionCookieName(),
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
