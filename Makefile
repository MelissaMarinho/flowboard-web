.PHONY: install dev build lint type-check db-push db-generate db-studio

install:
	npm install

dev:
	npm run dev

build:
	npm run build

lint:
	npm run lint

type-check:
	npx tsc --noEmit

db-push:
	npx prisma db push

db-generate:
	npx prisma generate

db-studio:
	npx prisma studio
