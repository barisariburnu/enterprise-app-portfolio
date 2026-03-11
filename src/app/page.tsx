"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Plus, Github, ExternalLink, Edit, Trash2, Search, Filter, FolderCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type ProjectStatus = "ACTIVE" | "DEVELOPMENT" | "ARCHIVED";

interface Project {
  id: string;
  name: string;
  description: string;
  githubUrl: string | null;
  liveUrl: string | null;
  status: ProjectStatus;
  tags: string;
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<ProjectStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  ACTIVE: { label: "Aktif", variant: "default" },
  DEVELOPMENT: { label: "Geliştirme", variant: "secondary" },
  ARCHIVED: { label: "Arşiv", variant: "outline" },
};

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    githubUrl: "",
    liveUrl: "",
    status: "ACTIVE" as ProjectStatus,
    tags: "",
  });
  const { toast } = useToast();

  // Fetch projects
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Projeler yüklenemedi");
      const data = await response.json();
      setProjects(data);
    } catch {
      toast({
        title: "Hata",
        description: "Projeler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkAdminSession = async () => {
    try {
      const response = await fetch("/api/admin/session");
      if (!response.ok) {
        setIsAdmin(false);
        return;
      }

      const data = await response.json();
      setIsAdmin(Boolean(data?.isAdmin));
    } catch {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    checkAdminSession();
  }, []);

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      githubUrl: "",
      liveUrl: "",
      status: "ACTIVE",
      tags: "",
    });
    setEditingProject(null);
  };

  // Open edit dialog
  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      githubUrl: project.githubUrl || "",
      liveUrl: project.liveUrl || "",
      status: project.status,
      tags: project.tags,
    });
    setIsDialogOpen(true);
  };

  const handleAdminLogin = async () => {
    if (!adminUsername || !adminPassword) {
      toast({
        title: "Eksik bilgi",
        description: "Kullanıcı adı ve parola zorunludur.",
        variant: "destructive",
      });
      return;
    }

    try {
      setAuthLoading(true);
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      });

      if (!response.ok) {
        throw new Error("Giriş başarısız");
      }

      setIsAdmin(true);
      setIsLoginDialogOpen(false);
      setAdminPassword("");
      toast({ title: "Başarılı", description: "Giriş yapıldı." });
    } catch {
      setIsAdmin(false);
      toast({
        title: "Hata",
        description: "Kullanıcı adı veya parola hatalı.",
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      setAuthLoading(true);
      await fetch("/api/admin/session", { method: "DELETE" });
      setIsAdmin(false);
      setIsDialogOpen(false);
      setEditingProject(null);
      setDeleteProjectId(null);
      setAdminPassword("");
      toast({ title: "Bilgi", description: "Admin oturumu kapatıldı." });
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const url = editingProject ? `/api/projects/${editingProject.id}` : "/api/projects";
      const method = editingProject ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorMessage = editingProject ? "Proje güncellenemedi" : "Proje eklenemedi";
        try {
          const errorData = await response.json();
          if (typeof errorData?.error === "string" && errorData.error.length > 0) {
            errorMessage = errorData.error;
          }
        } catch {
          // ignore parse errors
        }
        throw new Error(errorMessage);
      }

      toast({
        title: editingProject ? "Başarılı" : "Proje Eklendi",
        description: editingProject ? "Proje başarıyla güncellendi." : "Yeni proje başarıyla eklendi.",
      });

      setIsDialogOpen(false);
      resetForm();
      fetchProjects();
    } catch (error) {
      const message = error instanceof Error ? error.message : "İşlem sırasında bir hata oluştu.";
      toast({
        title: "Hata",
        description: message,
        variant: "destructive",
      });
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteProjectId) return;

    try {
      const response = await fetch(`/api/projects/${deleteProjectId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Proje silinemedi");

      toast({
        title: "Silindi",
        description: "Proje başarıyla silindi.",
      });

      setDeleteProjectId(null);
      fetchProjects();
    } catch {
      toast({
        title: "Hata",
        description: "Proje silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  // Stats
  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === "ACTIVE").length,
    development: projects.filter((p) => p.status === "DEVELOPMENT").length,
    archived: projects.filter((p) => p.status === "ARCHIVED").length,
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-900 dark:bg-white">
                <FolderCode className="w-6 h-6 text-white dark:text-slate-900" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  BUSKİ CBS Uygulamaları
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Tüm projeler
                </p>
              </div>
            </div>

            <div className="flex w-full sm:w-auto items-center gap-2">
              {!isAdmin ? (
                <Button
                  type="button"
                  onClick={() => setIsLoginDialogOpen(true)}
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  Giriş Yap
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAdminLogout}
                    disabled={authLoading}
                  >
                    {authLoading ? "Çıkış..." : "Çıkış Yap"}
                  </Button>
                  <Dialog
                    open={isDialogOpen}
                    onOpenChange={(open) => {
                      setIsDialogOpen(open);
                      if (!open) resetForm();
                    }}
                  >
                    <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-slate-900 text-white shadow-xs hover:bg-slate-800 h-9 px-4 py-2 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                      <Plus className="w-4 h-4" />
                      Yeni Proje
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <form onSubmit={handleSubmit}>
                        <DialogHeader>
                          <DialogTitle>{editingProject ? "Proje Düzenle" : "Yeni Proje Ekle"}</DialogTitle>
                          <DialogDescription>
                            {editingProject
                              ? "Proje bilgilerini güncelleyin."
                              : "Yeni proje bilgilerini girin."}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="name">Proje Adı *</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="Uygulama adını girin"
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="description">Açıklama *</Label>
                            <Textarea
                              id="description"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              placeholder="Projenin ne işe yaradığını açıklayın"
                              rows={3}
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="githubUrl">GitHub URL</Label>
                              <Input
                                id="githubUrl"
                                type="url"
                                value={formData.githubUrl}
                                onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                                placeholder="https://github.com/..."
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="liveUrl">Canlı URL</Label>
                              <Input
                                id="liveUrl"
                                type="url"
                                value={formData.liveUrl}
                                onChange={(e) => setFormData({ ...formData, liveUrl: e.target.value })}
                                placeholder="https://..."
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="status">Durum</Label>
                              <Select
                                value={formData.status}
                                onValueChange={(value: ProjectStatus) =>
                                  setFormData({ ...formData, status: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ACTIVE">Aktif</SelectItem>
                                  <SelectItem value="DEVELOPMENT">Geliştirme</SelectItem>
                                  <SelectItem value="ARCHIVED">Arşiv</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="tags">Teknolojiler</Label>
                              <Input
                                id="tags"
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                placeholder="React, Node.js, ..."
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900">
                            {editingProject ? "Güncelle" : "Ekle"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>

            <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
              <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                  <DialogTitle>Giriş Yap</DialogTitle>
                  <DialogDescription>
                    Yönetim işlemleri için admin hesabınızla giriş yapın.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="admin-username">Kullanıcı Adı</Label>
                    <Input
                      id="admin-username"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="admin"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="admin-password">Parola</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" onClick={handleAdminLogin} disabled={authLoading}>
                    {authLoading ? "Giriş..." : "Giriş Yap"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Toplam Proje</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Aktif</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.active}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Geliştirme</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.development}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Arşiv</p>
              <p className="text-2xl font-bold text-slate-400">{stats.archived}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Proje ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-slate-200 dark:border-slate-800"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] border-slate-200 dark:border-slate-800">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Durum Filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="ACTIVE">Aktif</SelectItem>
              <SelectItem value="DEVELOPMENT">Geliştirme</SelectItem>
              <SelectItem value="ARCHIVED">Arşiv</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <FolderCode className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              {searchQuery || statusFilter !== "all" ? "Proje Bulunamadı" : "Henüz Proje Yok"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              {searchQuery || statusFilter !== "all"
                ? "Arama kriterlerinize uygun proje bulunamadı."
                : "İlk projenizi ekleyerek başlayın."}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button
                onClick={() => {
                  if (!isAdmin) {
                    toast({
                      title: "Yetki gerekli",
                      description: "Proje eklemek için admin girişi yapmalısınız.",
                      variant: "destructive",
                    });
                    return;
                  }

                  setIsDialogOpen(true);
                }}
                disabled={!isAdmin}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Proje Ekle
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="group border-slate-200 dark:border-slate-800 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg text-slate-900 dark:text-white line-clamp-1">
                      {project.name}
                    </CardTitle>
                    <Badge variant={statusConfig[project.status].variant}>
                      {statusConfig[project.status].label}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {project.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  {project.tags && (
                    <div className="flex flex-wrap gap-1">
                      {project.tags.split(",").map((tag, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-xs border-slate-200 dark:border-slate-700"
                        >
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex-col gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex gap-2 w-full">
                    {project.githubUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => window.open(project.githubUrl!, "_blank")}
                      >
                        <Github className="w-4 h-4" />
                        GitHub
                      </Button>
                    )}
                    {project.liveUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => window.open(project.liveUrl!, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Canlı
                      </Button>
                    )}
                    {!project.githubUrl && !project.liveUrl && (
                      <span className="text-sm text-slate-400 dark:text-slate-500 flex-1 text-center">
                        Link eklenmemiş
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!isAdmin}
                      className="flex-1 gap-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                      onClick={() => {
                        if (!isAdmin) {
                          toast({
                            title: "Yetki gerekli",
                            description: "Düzenleme için admin girişi yapmalısınız.",
                            variant: "destructive",
                          });
                          return;
                        }

                        openEditDialog(project);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                      Düzenle
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!isAdmin}
                      className="flex-1 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                      onClick={() => {
                        if (!isAdmin) {
                          toast({
                            title: "Yetki gerekli",
                            description: "Silme işlemi için admin girişi yapmalısınız.",
                            variant: "destructive",
                          });
                          return;
                        }

                        setDeleteProjectId(project.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Sil
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
          BUSKİ CBS Uygulamaları Portföyü © {new Date().getFullYear()}
        </div>
      </footer>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProjectId} onOpenChange={(open) => !open && setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Projeyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu projeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
