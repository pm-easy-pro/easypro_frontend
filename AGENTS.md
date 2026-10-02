# EasyPro Frontend — Agent заавар

- Production: https://easypro.mn
- API: `NEXT_PUBLIC_API_URL=https://api.easypro.mn/api` (Vercel)

## Дүрэм

`.cursor/rules/production-data-safety.mdc` — production статус, backend өгөгдөлд хүрэх командууд санал болгохгүй

## Backend / өгөгдөл

Migration, seed, MySQL backup: **easypro_backend** repo — `docs/PRODUCTION.md`, `DEPLOY.md`

## Төслийн тэмдэглэл

- OTP login: `/login`
- Company admin: `/agent/*` (тусдаа `/agent/login`)
- Platform staff: `/dashboard/*`
