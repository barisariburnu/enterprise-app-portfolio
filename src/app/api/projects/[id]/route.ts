import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Tek proje getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await db.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Proje bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Proje yüklenirken hata:", error);
    return NextResponse.json(
      { error: "Proje yüklenemedi" },
      { status: 500 }
    );
  }
}

// PUT - Proje güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, githubUrl, liveUrl, status, tags } = body;

    const existingProject = await db.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Proje bulunamadı" },
        { status: 404 }
      );
    }

    const project = await db.project.update({
      where: { id },
      data: {
        name: name || existingProject.name,
        description: description || existingProject.description,
        githubUrl: githubUrl !== undefined ? githubUrl || null : existingProject.githubUrl,
        liveUrl: liveUrl !== undefined ? liveUrl || null : existingProject.liveUrl,
        status: status || existingProject.status,
        tags: tags !== undefined ? tags : existingProject.tags,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Proje güncellenirken hata:", error);
    return NextResponse.json(
      { error: "Proje güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Proje sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingProject = await db.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Proje bulunamadı" },
        { status: 404 }
      );
    }

    await db.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Proje silinirken hata:", error);
    return NextResponse.json(
      { error: "Proje silinemedi" },
      { status: 500 }
    );
  }
}
