"use client";

import {
  Checkbox,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
  Typography,
  message,
} from "antd";
import { useEffect, useState } from "react";

import { PropertyImageUploader } from "@/components/property/PropertyImageUploader";
import {
  GeocodeStatusHint,
  LocationPicker,
  type GeocodeStatus,
} from "@/components/map/LocationPicker";
import {
  BUILDING_TYPE_OPTIONS,
  defaultCreateValues,
  toFormValues,
  toPayload,
  type PropertyFormValues,
} from "@/components/dashboard/listingForm";
import {
  createManageProperty,
  fetchFilterOptions,
  updateManageProperty,
} from "@/lib/api";
import type { FilterOptions, Property } from "@/types";

const { Text } = Typography;
const { TextArea } = Input;

interface ListingFormModalProps {
  open: boolean;
  editing: Property | null;
  isStaff: boolean;
  isCompanyAdmin: boolean;
  onClose: () => void;
  onSaved: (property: Property) => void;
}

export function ListingFormModal({
  open,
  editing,
  isStaff,
  isCompanyAdmin,
  onClose,
  onSaved,
}: ListingFormModalProps) {
  const [form] = Form.useForm<PropertyFormValues>();
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState<GeocodeStatus>("idle");

  const latitude = Form.useWatch("latitude", form);
  const longitude = Form.useWatch("longitude", form);
  const officialAddress = Form.useWatch("official_address", form);
  const unofficialText = Form.useWatch("unofficial_addresses_text", form);

  const mapPos =
    latitude != null &&
    longitude != null &&
    !Number.isNaN(Number(latitude)) &&
    !Number.isNaN(Number(longitude))
      ? { lat: Number(latitude), lng: Number(longitude) }
      : null;

  const mapSearchQuery =
    (unofficialText || "")
      .split("\n")
      .map((s) => s.trim())
      .find(Boolean) ||
    officialAddress ||
    "";

  useEffect(() => {
    if (!open) return;
    fetchFilterOptions().then(setOptions).catch(() => undefined);
    setGeocodeStatus("idle");
    if (editing) {
      form.setFieldsValue(toFormValues(editing));
    } else {
      form.resetFields();
      form.setFieldsValue(defaultCreateValues() as PropertyFormValues);
    }
  }, [open, editing, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = toPayload(values, editing);
      const saved = editing
        ? await updateManageProperty(editing.id, payload)
        : await createManageProperty(payload);
      message.success(editing ? "Зар шинэчлэгдлээ" : "Зар үүслээ");
      onSaved(saved);
      onClose();
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return;
      message.error("Хадгалахад алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={editing ? "Зар засах" : "Шинэ зар"}
      open={open}
      onCancel={onClose}
      onOk={() => void handleSubmit()}
      confirmLoading={submitting}
      okText="Хадгалах"
      cancelText="Болих"
      width={840}
      destroyOnClose
      styles={{ body: { maxHeight: "72vh", overflowY: "auto" } }}
    >
      <Form form={form} layout="vertical" className="mt-2 pr-1">
        <Text strong className="mb-2 block text-slate-700">
          Үндсэн мэдээлэл
        </Text>
        <Form.Item
          name="title"
          label="Гарчиг"
          rules={[{ required: true, message: "Гарчиг оруулна уу" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="description"
          label="Тайлбар"
          rules={[{ required: true, message: "Тайлбар оруулна уу" }]}
        >
          <TextArea rows={4} />
        </Form.Item>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Form.Item name="listing_type" label="Зарын төрөл" rules={[{ required: true }]}>
            <Select options={options?.listing_types} />
          </Form.Item>
          <Form.Item name="property_type" label="Үл хөдлөхийн төрөл" rules={[{ required: true }]}>
            <Select options={options?.property_types} />
          </Form.Item>
          <Form.Item name="condition" label="Нөхцөл" rules={[{ required: true }]}>
            <Select options={options?.conditions} />
          </Form.Item>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Form.Item name="status" label="Төлөв" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "active", label: "Идэвхтэй" },
                { value: "pending", label: "Хүлээгдэж буй" },
                { value: "sold", label: "Зарагдсан" },
                { value: "rented", label: "Түрээслэгдсэн" },
                { value: "archived", label: "Архив" },
              ]}
            />
          </Form.Item>
          {isStaff ? (
            <Form.Item name="listing_owner_type" label="Зарын эзэн">
              <Select options={options?.listing_owner_types} />
            </Form.Item>
          ) : null}
        </div>

        <Divider className="!my-4" />
        <Text strong className="mb-2 block text-slate-700">
          Байршил
        </Text>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Form.Item name="district" label="Дүүрэг" rules={[{ required: true }]}>
            <Select
              options={
                options?.district_choices || [
                  { value: "hud", label: "Хан-Уул" },
                  { value: "bayanzurkh", label: "Баянзүрх" },
                ]
              }
            />
          </Form.Item>
          <Form.Item
            name="official_address"
            label="Албан ёсны хаяг"
            rules={[{ required: true, message: "Хаяг оруулна уу" }]}
          >
            <Input />
          </Form.Item>
        </div>
        <Form.Item
          name="unofficial_addresses_text"
          label="Бусад нэршил"
          extra="Мөр бүрт нэг нэршил — эхний мөрөөр газрын зураг хайна"
        >
          <TextArea rows={2} placeholder="Жишээ: Солонго хотхон" />
        </Form.Item>

        <Form.Item name="latitude" hidden>
          <InputNumber />
        </Form.Item>
        <Form.Item name="longitude" hidden>
          <InputNumber />
        </Form.Item>

        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-700">Газрын зураг дээрх байршил</p>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                mapPos ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              {mapPos ? "Тэмдэглэгдсэн" : "Pin тавина уу"}
            </span>
          </div>
          <LocationPicker
            value={mapPos}
            searchQuery={mapSearchQuery}
            onChange={(pos) => {
              form.setFieldsValue({
                latitude: pos.lat,
                longitude: pos.lng,
              });
            }}
            onGeocodeStatus={setGeocodeStatus}
            className="h-64 sm:h-72"
          />
          <GeocodeStatusHint status={geocodeStatus} />
          {!mapPos && geocodeStatus === "idle" ? (
            <p className="mt-2 text-xs text-slate-500">
              Хаяг эсвэл хотхоны нэр бичнэ үү — эсвэл зураг дээр дарж pin тавина уу
            </p>
          ) : null}
        </div>

        <Divider className="!my-4" />
        <Text strong className="mb-2 block text-slate-700">
          Үнэ, талбай, тохиргоо
        </Text>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Form.Item name="price" label="Үнэ (₮)" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} step={100000} />
          </Form.Item>
          <Form.Item name="area_m2" label="Талбай (м²)" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} step={0.5} />
          </Form.Item>
          <Form.Item name="room_count" label="Өрөө" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} />
          </Form.Item>
          <Form.Item name="bathroom_count" label="Угаалгын өрөө">
            <InputNumber className="w-full" min={0} />
          </Form.Item>
          <Form.Item name="window_count" label="Цонхны тоо">
            <InputNumber className="w-full" min={0} />
          </Form.Item>
          <Form.Item name="view_directions" label="Цонхны харагдац">
            <Select
              mode="multiple"
              allowClear
              options={options?.view_directions}
              placeholder="Олон чиглэл"
              maxTagCount="responsive"
            />
          </Form.Item>
          <Form.Item name="floor" label="Давхар">
            <InputNumber className="w-full" />
          </Form.Item>
          <Form.Item name="total_floor" label="Нийт давхар">
            <InputNumber className="w-full" />
          </Form.Item>
          <Form.Item name="year_built" label="Баригдсан он">
            <InputNumber className="w-full" min={1950} max={2030} />
          </Form.Item>
        </div>
        <Form.Item name="building_type" label="Барилгын хийц">
          <Select allowClear options={BUILDING_TYPE_OPTIONS} />
        </Form.Item>
        <Form.Item name="payment_terms" label="Төлбөрийн нөхцөл">
          <Checkbox.Group
            className="flex flex-col gap-2"
            options={(options?.payment_terms || []).map((o) => ({
              value: o.value,
              label: o.label,
            }))}
          />
        </Form.Item>

        <Divider className="!my-4" />
        <Text strong className="mb-2 block text-slate-700">
          Зураг
        </Text>
        <Form.Item name="images" label="Зургууд" valuePropName="value" getValueFromEvent={(v) => v}>
          <PropertyImageUploader />
        </Form.Item>

        <Divider className="!my-4" />
        <Text strong className="mb-2 block text-slate-700">
          Нэмэлт сонголт
        </Text>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(isStaff || isCompanyAdmin) && (
            <Form.Item name="is_vip" label="VIP" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
          {isStaff && (
            <Form.Item name="is_verified" label="Баталгаажсан" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
          <Form.Item name="is_active" label="Идэвхтэй" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="has_elevator" label="Цахилгаан шат" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="garage" label="Гараж" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="balcony" label="Тагт" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="furnished" label="Тавилгатай" valuePropName="checked">
            <Switch />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
