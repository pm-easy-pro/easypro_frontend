"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, Card, Form, Input, Tag, Typography, message } from "antd";
import { Camera, Trash2, User } from "lucide-react";

import { useAuth } from "@/providers/AuthProvider";

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export default function AgentPortalProfilePage() {
  const { user, updateProfile } = useAuth();
  const profile = user?.agent_profile;
  const [form] = Form.useForm();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [clearAvatar, setClearAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    form.setFieldsValue({
      display_name: profile?.display_name || user.display_name || "",
      title: profile?.title || "",
      email: user.email || profile?.email || "",
      bio: profile?.bio || "",
    });
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setAvatarFile(null);
    setClearAvatar(false);
  }, [user, profile, form]);

  const currentAvatar =
    clearAvatar ? null : preview || user?.avatar_url || profile?.avatar_url || null;

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      message.error("Зөвхөн зураг сонгоно уу");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error("Зураг 5MB-аас бага байх ёстой");
      return;
    }
    setAvatarFile(file);
    setClearAvatar(false);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    // Upload immediately so зураг сонгоход шууд хадгалагдана
    setSaving(true);
    try {
      await updateProfile({ avatar: file });
      message.success("Профайл зураг хадгалагдлаа");
      setAvatarFile(null);
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    } catch (err: unknown) {
      const data =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: Record<string, unknown> } }).response?.data
          : undefined;
      const first =
        data &&
        Object.values(data)
          .flat()
          .find((m) => typeof m === "string");
      message.error(typeof first === "string" ? first : "Зураг хадгалахад алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  const onSave = async (values: {
    display_name: string;
    title: string;
    email: string;
    bio: string;
  }) => {
    setSaving(true);
    try {
      await updateProfile({
        display_name: values.display_name.trim(),
        title: values.title.trim(),
        email: values.email.trim(),
        bio: values.bio.trim(),
        first_name: values.display_name.trim().split(/\s+/)[0] || undefined,
        avatar: avatarFile || undefined,
        clear_avatar: clearAvatar && !avatarFile,
      });
      message.success("Профайл хадгалагдлаа");
      setAvatarFile(null);
      setPreview(null);
      setClearAvatar(false);
    } catch (err: unknown) {
      const data =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: Record<string, unknown> } }).response?.data
          : undefined;
      const first =
        data &&
        Object.values(data)
          .flat()
          .find((m) => typeof m === "string");
      message.error(typeof first === "string" ? first : "Хадгалахад алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Title level={3} className="!mb-1">
          Профайл
        </Title>
        <Paragraph type="secondary" className="!mb-0">
          Нэр, албан тушаал, профайл зургаа шинэчилнэ үү. Зарын дэлгэрэнгүй дээр харагдана.
        </Paragraph>
      </div>

      <Card className="shadow-sm">
        <div className="mb-6 flex flex-wrap items-center gap-5">
          <div className="relative">
            <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-[#183E95]/10 text-[#183E95] ring-2 ring-slate-100">
              {currentAvatar ? (
                <Image
                  src={currentAvatar}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                  sizes="96px"
                />
              ) : (
                <User className="h-10 w-10" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#183E95] text-white shadow-md transition hover:bg-[#142f70]"
              aria-label="Зураг солих"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                void onPickFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <Text strong className="text-base">
              Профайл зураг
            </Text>
            <p className="mt-1 text-sm text-slate-500">
              JPG, PNG, WEBP · хамгийн ихдээ 5MB
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="small" onClick={() => fileRef.current?.click()}>
                Зураг сонгох
              </Button>
              {currentAvatar ? (
                <Button
                  size="small"
                  danger
                  loading={saving}
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={() => {
                    void (async () => {
                      setSaving(true);
                      try {
                        await updateProfile({ clear_avatar: true });
                        setAvatarFile(null);
                        setPreview(null);
                        setClearAvatar(false);
                        message.success("Профайл зураг устгалаа");
                      } catch {
                        message.error("Устгахад алдаа гарлаа");
                      } finally {
                        setSaving(false);
                      }
                    })();
                  }}
                >
                  Устгах
                </Button>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile?.is_verified ? <Tag color="blue">Баталгаажсан</Tag> : <Tag>Энгийн</Tag>}
              {profile?.membership_status_display ? (
                <Tag>{profile.membership_status_display}</Tag>
              ) : null}
            </div>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={onSave}
        >
          <Form.Item
            name="display_name"
            label="Нэршил"
            rules={[{ required: true, message: "Нэр оруулна уу" }]}
          >
            <Input size="large" placeholder="Жишээ: Бат-Эрдэнэ" className="!rounded-xl" />
          </Form.Item>
          <Form.Item name="title" label="Албан тушаал">
            <Input
              size="large"
              placeholder="Жишээ: Senior broker, Platinum agent"
              className="!rounded-xl"
            />
          </Form.Item>
          <Form.Item name="email" label="И-мэйл">
            <Input size="large" type="email" className="!rounded-xl" />
          </Form.Item>
          <Form.Item label="Утас">
            <Input
              size="large"
              disabled
              value={user?.phone || profile?.phone || ""}
              className="!rounded-xl !bg-slate-50"
            />
            <p className="mt-1 text-xs text-slate-400">
              Утасны дугаар нэвтрэлттэй холбоотой — солих боломжгүй
            </p>
          </Form.Item>
          <Form.Item label="Компани">
            <Input
              size="large"
              disabled
              value={
                profile?.organization_name ||
                profile?.organization_detail?.company_name ||
                "—"
              }
              className="!rounded-xl !bg-slate-50"
            />
          </Form.Item>
          <Form.Item name="bio" label="Танилцуулга">
            <TextArea
              rows={4}
              placeholder="Өөрийнхөө тухай товч..."
              className="!rounded-xl"
              maxLength={1000}
              showCount
            />
          </Form.Item>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {profile?.id ? (
              <Link
                href={`/agents/${profile.id}`}
                className="text-sm font-medium text-[#183E95] hover:underline"
              >
                Нийтэд харагдах профайл →
              </Link>
            ) : (
              <span />
            )}
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={saving}
              className="!h-11 !rounded-xl !px-8 !font-semibold"
            >
              Хадгалах
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
