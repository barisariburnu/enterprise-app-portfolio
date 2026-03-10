import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Tüm projeleri getir
export async function GET() {
  try {
    const projects = await db.project.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Projeler yüklenirken hata:", error);
    return NextResponse.json(
      { error: "Projeler yüklenemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni proje ekle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
    console.error("Proje eklenirken hata:", error);
    return NextResponse.json(
      { error: "Proje eklenemedi" },
      { status: 500 }
    );
  }
}
