import { reportError } from '@/lib/monitoring.cjs'
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin";

// GET - Tüm projeleri getir
export async function GET() {
  try {
    const projects = await db.project.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(projects);
  } catch (error) {
    reportError('OP_APP_API_PROJECTS_ROUTE_TS_1', error);
    return NextResponse.json(
      { error: "Projeler yüklenemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni proje ekle
export async function POST(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json(
        { error: "Bu işlem için admin yetkisi gerekli" },
        { status: 403 }
      );
    }

    const body = await request.json();
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
    }
    const { name, description, githubUrl, liveUrl, status, tags } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: "Proje adı ve açıklama zorunludur" },
        { status: 400 }
      );
    }

    const project = await db.project.create({
      data: {
        name,
        description,
        githubUrl: githubUrl || null,
        liveUrl: liveUrl || null,
        status: status || "ACTIVE",
        tags: tags || "",
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    reportError('OP_APP_API_PROJECTS_ROUTE_TS_2', error);
    return NextResponse.json(
      { error: "Proje eklenemedi" },
      { status: 500 }
    );
  }
}
