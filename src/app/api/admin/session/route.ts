import { NextResponse, type NextRequest } from "next/server";
import {
  getAdminSessionCookieName,
  isAdminCredentials,
  isAdminRequest,
} from "@/lib/admin";

const ONE_DAY_IN_SECONDS = 60 * 60 * 24;

function isSecureRequest(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0].trim() === "https";
  }

  return request.nextUrl.protocol === "https:";
}

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
      secure: isSecureRequest(request),
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Giriş işlemi başarısız" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true, isAdmin: false });
  response.cookies.set({
    name: getAdminSessionCookieName(),
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: isSecureRequest(request),
  });

  return response;
}
